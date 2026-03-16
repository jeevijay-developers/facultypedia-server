import PaymentIntent from "../models/paymentIntent.js";
import Course from "../models/course.js";
import Webinar from "../models/webinar.js";
import TestSeries from "../models/testSeries.js";
import Test from "../models/test.js";
import Payout from "../models/payout.js";

const COMMISSION_PERCENTAGE = process.env.COMMISSION_PERCENTAGE
  ? parseInt(process.env.COMMISSION_PERCENTAGE)
  : 20;

const getEducatorIdFromProduct = async (productId, productType) => {
  try {
    let product;
    if (productType === "course") {
      product = await Course.findById(productId).select("educatorID");
      return product?.educatorID;
    } else if (productType === "webinar") {
      product = await Webinar.findById(productId).select("educatorID");
      return product?.educatorID;
    } else if (productType === "testSeries") {
      product = await TestSeries.findById(productId).select("educatorId");
      return product?.educatorId;
    } else if (productType === "test") {
      product = await Test.findById(productId).select("educatorID");
      return product?.educatorID;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching product ${productId} (${productType}):`, error);
    return null;
  }
};

export const calculatePayoutsForMonth = async (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  console.log(`Calculating payouts for ${startDate.toISOString()} to ${endDate.toISOString()}`);

  // 1. Aggregate successful payments
  const successfulPayments = await PaymentIntent.find({
    status: "succeeded",
    createdAt: { $gte: startDate, $lte: endDate },
  });

  // 2. Map Revenue to Educators
  const educatorRevenueMap = {};

  for (const payment of successfulPayments) {
    const { productId, productType, amount } = payment;

    // Find educator
    const educatorIdObj = await getEducatorIdFromProduct(productId, productType);
    
    if (!educatorIdObj) continue;

    const educatorId = educatorIdObj.toString();

    if (!educatorRevenueMap[educatorId]) {
      educatorRevenueMap[educatorId] = { gross: 0, commission: 0, payable: 0 };
    }

    const commission = Math.round((amount * COMMISSION_PERCENTAGE) / 100);
    const payable = amount - commission;

    educatorRevenueMap[educatorId].gross += amount;
    educatorRevenueMap[educatorId].commission += commission;
    educatorRevenueMap[educatorId].payable += payable;
  }

  // 3. Create or Update Payout Records
  const payoutRecords = [];

  for (const [educatorId, data] of Object.entries(educatorRevenueMap)) {
    const payoutCheckId = `PAYOUT_${year}_${month}_${educatorId}`;

    let payout = await Payout.findOne({ payoutCheckId });

    if (payout) {
      if (payout.status === "pending") {
        payout.grossAmount = data.gross;
        payout.commissionAmount = data.commission;
        payout.amount = data.payable;
        await payout.save();
        payoutRecords.push(payout);
      }
    } else {
      payout = await Payout.create({
        educatorId,
        amount: data.payable,
        grossAmount: data.gross,
        commissionAmount: data.commission,
        month,
        year,
        payoutCheckId,
        scheduledDate: new Date(),
        status: "pending",
      });
      payoutRecords.push(payout);
    }
  }

  return payoutRecords;
};

export const upsertMonthlyPayoutForEducator = async ({ educatorId, month, year }) => {
  if (!educatorId || !month || !year) {
    return null;
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const successfulPayments = await PaymentIntent.find({
    status: "succeeded",
    createdAt: { $gte: startDate, $lte: endDate },
  }).select("productId productType amount createdAt");

  const payoutCheckId = `PAYOUT_${year}_${month}_${educatorId}`;
  let payout = await Payout.findOne({ payoutCheckId });

  const computeTotals = async (afterDate = null) => {
    let gross = 0;
    let commission = 0;
    let payable = 0;

    for (const payment of successfulPayments) {
      if (afterDate && payment.createdAt && payment.createdAt <= afterDate) {
        continue;
      }

      const ownerId = await getEducatorIdFromProduct(
        payment.productId,
        payment.productType
      );

      if (!ownerId || ownerId.toString() !== educatorId.toString()) {
        continue;
      }

      const amount = Number(payment.amount) || 0;
      const entryCommission = Math.round((amount * COMMISSION_PERCENTAGE) / 100);
      gross += amount;
      commission += entryCommission;
      payable += amount - entryCommission;
    }

    return { gross, commission, payable };
  };

  if (!payout) {
    const totals = await computeTotals();
    if (totals.gross <= 0) {
      return null;
    }

    payout = await Payout.create({
      educatorId,
      amount: totals.payable,
      grossAmount: totals.gross,
      commissionAmount: totals.commission,
      month,
      year,
      payoutCheckId,
      scheduledDate: new Date(),
      status: "pending",
    });
    return payout;
  }

  if (payout.status === "pending") {
    const totals = await computeTotals();
    payout.grossAmount = totals.gross;
    payout.commissionAmount = totals.commission;
    payout.amount = totals.payable;
    await payout.save();
    return payout;
  }

  // If month payout is already closed, create/update an adjustment payout
  // for fresh sales made after that payout was finalized.
  const cutoff = payout.updatedAt || payout.createdAt;
  const adjTotals = await computeTotals(cutoff);
  if (adjTotals.gross <= 0) {
    return payout;
  }

  const adjCheckId = `${payoutCheckId}_ADJ`;
  let adjustment = await Payout.findOne({ payoutCheckId: adjCheckId });

  if (!adjustment) {
    adjustment = await Payout.create({
      educatorId,
      amount: adjTotals.payable,
      grossAmount: adjTotals.gross,
      commissionAmount: adjTotals.commission,
      month,
      year,
      payoutCheckId: adjCheckId,
      scheduledDate: new Date(),
      status: "pending",
      narration: "Payout Adjustment",
    });
    return adjustment;
  }

  if (adjustment.status === "pending") {
    adjustment.grossAmount = adjTotals.gross;
    adjustment.commissionAmount = adjTotals.commission;
    adjustment.amount = adjTotals.payable;
    await adjustment.save();
  }

  return adjustment;
};
