import { randomUUID } from "crypto";
import Payout from "../models/payout.js";
import {
  createPayout as createRazorpayPayout,
  formatPayoutNarration,
} from "../services/razorpay.service.js";
import { calculatePayoutsForMonth } from "../services/payout.service.js";

// Calculate Payouts for a specific month
export const calculateMonthlyPayouts = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const payoutRecords = await calculatePayoutsForMonth(month, year);

    res.status(200).json({
      success: true,
      message: "Payouts calculated successfully",
      data: {
        count: payoutRecords.length,
        payouts: payoutRecords,
      },
    });
  } catch (error) {
    console.error("Error calculating payouts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Process (Pay) a specific Payout
export const processPayout = async (req, res) => {
  try {
    const { payoutId } = req.body;

    if (!payoutId) {
      return res
        .status(400)
        .json({ success: false, message: "Payout ID is required" });
    }

    const payout = await Payout.findById(payoutId).populate({
      path: "educatorId",
      select: "fullName email razorpayFundAccountId razorpayContactId",
    });

    if (!payout) {
      return res
        .status(404)
        .json({ success: false, message: "Payout record not found" });
    }

    if (payout.status !== "pending" && payout.status !== "failed") {
      return res.status(400).json({
        success: false,
        message: `Payout is already ${payout.status}`,
      });
    }

    const educator = payout.educatorId;
    if (!educator) {
      return res.status(400).json({
        success: false,
        message: "Educator not found for this payout",
      });
    }

    if (!educator.razorpayFundAccountId) {
      // Provide helpful error message with next steps
      const hasBankDetails =
        educator.bankDetails &&
        educator.bankDetails.accountNumber &&
        educator.bankDetails.ifscCode;

      return res.status(400).json({
        success: false,
        message: "Educator does not have a linked Fund Account",
        details: hasBankDetails
          ? "Bank details exist but fund account was not created. Please update bank details again."
          : "Please update bank details to create a fund account.",
        educatorId: educator._id.toString(),
      });
    }

    // Validate minimum payout amount (RazorpayX requires minimum ₹1 = 100 paise)
    const MIN_PAYOUT_AMOUNT = 100; // 100 paise = ₹1
    if (payout.amount < MIN_PAYOUT_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Payout amount too low. Minimum payout is ₹1 (100 paise). Current: ${payout.amount} paise`,
      });
    }

    // Ensure idempotency key is set
    const idempotencyKey = payout.idempotencyKey || randomUUID();
    payout.idempotencyKey = idempotencyKey;

    // Format narration according to Razorpay requirements (max 30 chars, no special chars)
    const narration = formatPayoutNarration(payout.month, payout.year);

    // Call Razorpay Service (payout.amount is already in paise)
    const razorpayPayout = await createRazorpayPayout({
      fundAccountId: educator.razorpayFundAccountId,
      amount: Math.round(payout.amount),
      currency: payout.currency,
      referenceId: payout.payoutCheckId,
      narration: narration,
      idempotencyKey,
    });

    // Update Payout Record
    payout.status = "processing"; // Razorpay returns 'processing' usually
    payout.razorpayPayoutId = razorpayPayout.id;
    await payout.save();

    res.status(200).json({
      success: true,
      message: "Payout initiated successfully",
      data: payout,
    });
  } catch (error) {
    console.error("Error processing payout:", error);
    res.status(500).json({
      success: false,
      message: "Payout failed",
      error: error.message,
    });
  }
};

// Get all payouts
export const getAllPayouts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      month,
      year,
      scheduledDate,
    } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (scheduledDate) {
      // Filter by scheduled date (can be a specific date or date range)
      const date = new Date(scheduledDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      filter.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payouts = await Payout.find(filter)
      .populate({
        path: "educatorId",
        select: "fullName email",
        options: { lean: false },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Handle null educatorIds gracefully
    const payoutsWithEducator = payouts.map((payout) => {
      if (!payout.educatorId) {
        return {
          ...payout.toObject(),
          educatorId: {
            _id: null,
            fullName: "Unknown",
            email: "N/A",
          },
        };
      }
      return payout;
    });

    const total = await Payout.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        payouts: payoutsWithEducator,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get monthly sales summary per educator
export const getMonthlySalesSummary = async (req, res) => {
  try {
    const { page = 1, limit = 10, month, year, scheduledDate } = req.query;

    // Build filter for payouts
    const filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (scheduledDate) {
      const date = new Date(scheduledDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      filter.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregate payouts by educator, month, and year
    const payouts = await Payout.find(filter)
      .populate({
        path: "educatorId",
        select: "fullName email razorpayFundAccountId",
      })
      .sort({ scheduledDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Group by educatorId, month, year to get unique combinations
    const summaryMap = new Map();

    for (const payout of payouts) {
      // Skip payouts with null or missing educatorId
      if (!payout.educatorId || !payout.educatorId._id) {
        console.warn(
          `Skipping payout ${payout._id} - educatorId is null or missing`
        );
        continue;
      }

      const key = `${payout.educatorId._id}_${payout.month}_${payout.year}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          educatorId: payout.educatorId._id,
          educator: payout.educatorId,
          month: payout.month,
          year: payout.year,
          totalSales: 0,
          totalCommission: 0,
          totalPayable: 0,
          scheduledDate: payout.scheduledDate,
          status: payout.status,
          payoutId: payout._id,
        });
      }

      const summary = summaryMap.get(key);
      summary.totalSales += payout.grossAmount || 0;
      summary.totalCommission += payout.commissionAmount || 0;
      summary.totalPayable += payout.amount || 0;
    }

    const monthlySales = Array.from(summaryMap.values());

    // Get total unique combinations for pagination (excluding null educatorIds)
    const allPayouts = await Payout.find(filter).select(
      "educatorId month year"
    );
    const uniqueKeys = new Set(
      allPayouts
        .filter((p) => p.educatorId) // Filter out null educatorIds
        .map((p) => `${p.educatorId}_${p.month}_${p.year}`)
    );
    const uniqueCount = uniqueKeys.size;

    res.status(200).json({
      success: true,
      data: {
        monthlySales,
        pagination: {
          total: uniqueCount,
          page: parseInt(page),
          pages: Math.ceil(uniqueCount / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching monthly sales summary:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Process bulk payouts
export const processBulkPayouts = async (req, res) => {
  try {
    const { payoutIds, month, year } = req.body;

    let payoutsToProcess = [];

    if (payoutIds && Array.isArray(payoutIds) && payoutIds.length > 0) {
      // Process specific payout IDs
      payoutsToProcess = await Payout.find({
        _id: { $in: payoutIds },
        status: { $in: ["pending", "failed"] },
      }).populate({
        path: "educatorId",
        select: "fullName email razorpayFundAccountId",
      });
    } else if (month && year) {
      // Process all pending payouts for the specified month/year
      payoutsToProcess = await Payout.find({
        month: parseInt(month),
        year: parseInt(year),
        status: { $in: ["pending", "failed"] },
      }).populate({
        path: "educatorId",
        select: "fullName email razorpayFundAccountId",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Either payoutIds array or month and year are required",
      });
    }

    if (payoutsToProcess.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No pending payouts found to process",
      });
    }

    const results = [];
    let succeeded = 0;
    let failed = 0;

    // Process each payout sequentially with delay
    for (const payout of payoutsToProcess) {
      try {
        // Verify educator exists
        if (!payout.educatorId) {
          results.push({
            payoutId: payout._id.toString(),
            educatorId: null,
            educatorName: "Unknown",
            status: "failed",
            error: "Educator not found for this payout",
          });
          failed++;
          continue;
        }

        // Verify educator has fund account
        if (!payout.educatorId.razorpayFundAccountId) {
          results.push({
            payoutId: payout._id.toString(),
            educatorId: payout.educatorId._id?.toString() || "Unknown",
            educatorName: payout.educatorId.fullName || "Unknown",
            status: "failed",
            error: "Educator does not have a linked Fund Account",
          });
          failed++;
          continue;
        }

        // Validate minimum payout amount (RazorpayX requires minimum ₹1 = 100 paise)
        const MIN_PAYOUT_AMOUNT = 100;
        if (payout.amount < MIN_PAYOUT_AMOUNT) {
          results.push({
            payoutId: payout._id.toString(),
            educatorId: payout.educatorId._id?.toString() || "Unknown",
            educatorName: payout.educatorId.fullName || "Unknown",
            status: "failed",
            error: `Payout amount too low (${payout.amount} paise). Minimum: ₹1`,
          });
          failed++;
          continue;
        }

        // Ensure idempotency key is set
        const idempotencyKey = payout.idempotencyKey || randomUUID();
        payout.idempotencyKey = idempotencyKey;

        // Format narration according to Razorpay requirements (max 30 chars, no special chars)
        const narration = formatPayoutNarration(payout.month, payout.year);

        // Call Razorpay Service
        const razorpayPayout = await createRazorpayPayout({
          fundAccountId: payout.educatorId.razorpayFundAccountId,
          amount: Math.round(payout.amount),
          currency: payout.currency || "INR",
          referenceId: payout.payoutCheckId,
          narration: narration,
          idempotencyKey,
        });

        // Update Payout Record
        payout.status = "processing";
        payout.razorpayPayoutId = razorpayPayout.id;
        await payout.save();

        results.push({
          payoutId: payout._id.toString(),
          educatorId: payout.educatorId._id.toString(),
          educatorName: payout.educatorId.fullName || "Unknown",
          status: "success",
          razorpayPayoutId: razorpayPayout.id,
        });
        succeeded++;

        // Add delay between payouts to avoid rate limits (1-2 seconds)
        if (payoutsToProcess.indexOf(payout) < payoutsToProcess.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error(`Error processing payout ${payout._id}:`, error);
        results.push({
          payoutId: payout._id.toString(),
          educatorId: payout.educatorId._id.toString(),
          educatorName: payout.educatorId.fullName || "Unknown",
          status: "failed",
          error: error.message || "Unknown error occurred",
        });
        failed++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk payout processing completed. ${succeeded} succeeded, ${failed} failed.`,
      data: {
        results,
        summary: {
          total: payoutsToProcess.length,
          succeeded,
          failed,
        },
      },
    });
  } catch (error) {
    console.error("Error processing bulk payouts:", error);
    res.status(500).json({
      success: false,
      message: "Bulk payout processing failed",
      error: error.message,
    });
  }
};

export const getEducatorPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, month, year } = req.query;
    const filter = { educatorId: req.educator?._id };
    if (status) filter.status = status;
    if (month) filter.month = month;
    if (year) filter.year = year;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payouts, total] = await Promise.all([
      Payout.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payout.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payouts,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
