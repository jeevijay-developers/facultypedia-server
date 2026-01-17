import axios from "axios";

// Format payout narration according to Razorpay requirements
// Max 30 characters, alphanumeric and spaces only, no special characters
export const formatPayoutNarration = (month, year) => {
  // Format: "FP Payout M YYYY" (e.g., "FP Payout 1 2026")
  const formatted = `FP Payout ${month} ${year}`;
  
  // Remove any special characters (keep only alphanumeric and spaces)
  const sanitized = formatted.replace(/[^a-zA-Z0-9\s]/g, "");
  
  // Truncate to max 30 characters
  const truncated = sanitized.substring(0, 30).trim();
  
  // Fallback to simple "Payout" if empty after sanitization
  return truncated || "Payout";
};

// Create a contact in RazorpayX
export const createContact = async (educator) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  try {
    const payload = {
      name: educator.fullName || `${educator.firstName} ${educator.lastName}`,
      email: educator.email,
      contact: educator.mobileNumber,
      type: "vendor",
      reference_id: educator._id.toString(),
      notes: {
        source: "facultypedia_educator",
      },
    };

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await axios.post(
      "https://api.razorpay.com/v1/contacts",
      payload,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error?.description || error.message || "";
    throw new Error(`Razorpay Contact Creation Failed: ${message}`);
  }
};

// Create a fund account for a contact in RazorpayX
export const createFundAccount = async (contactId, bankDetails) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  // Validate required fields
  if (!contactId) {
    throw new Error("Contact ID is required to create fund account");
  }

  if (!bankDetails) {
    throw new Error("Bank details are required to create fund account");
  }

  const requiredFields = ["accountHolderName", "accountNumber", "ifscCode"];
  const missingFields = requiredFields.filter(
    (field) => !bankDetails[field] || bankDetails[field].trim() === ""
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required bank details: ${missingFields.join(", ")}`
    );
  }

  // Validate IFSC code format (11 characters: 4 letters + 0 + 6 alphanumeric)
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(bankDetails.ifscCode.toUpperCase())) {
    throw new Error("Invalid IFSC code format");
  }

  try {
    const payload = {
      contact_id: contactId,
      account_type: "bank_account",
      bank_account: {
        name: bankDetails.accountHolderName.trim(),
        ifsc: bankDetails.ifscCode.toUpperCase().trim(),
        account_number: bankDetails.accountNumber.trim(),
      },
    };

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await axios.post(
      "https://api.razorpay.com/v1/fund_accounts",
      payload,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data || !response.data.id) {
      throw new Error("Fund account creation failed - invalid response from Razorpay");
    }

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error?.description || error.message || "";
    throw new Error(`Razorpay Fund Account Creation Failed: ${message}`);
  }
};

// Initiate a payout
export const createPayout = async (payoutData) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  if (!accountNumber) {
    throw new Error("RazorpayX account number is not configured");
  }

  if (!payoutData.idempotencyKey) {
    throw new Error("Payout idempotency key is required");
  }

  try {
    // Validate and format narration
    let narration = payoutData.narration || "Payout";
    
    // If narration is provided, sanitize it to meet Razorpay requirements
    if (narration) {
      // Remove special characters (keep only alphanumeric and spaces)
      narration = narration.replace(/[^a-zA-Z0-9\s]/g, "");
      // Truncate to max 30 characters
      narration = narration.substring(0, 30).trim();
      // Fallback if empty
      if (!narration) {
        narration = "Payout";
      }
    }

    const payload = {
      account_number: accountNumber,
      fund_account_id: payoutData.fundAccountId,
      amount: payoutData.amount,
      currency: payoutData.currency || "INR",
      mode: payoutData.mode || "IMPS",
      purpose: "payout", // Always set to "payout" as required by Razorpay
      queue_if_low_balance:
        payoutData.queueIfLowBalance === undefined
          ? true
          : payoutData.queueIfLowBalance,
      reference_id: payoutData.referenceId,
      narration: narration,
      notes: payoutData.notes || {},
    };

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await axios.post(
      "https://api.razorpay.com/v1/payouts",
      payload,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          "X-Payout-Idempotency": payoutData.idempotencyKey,
        },
      }
    );

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error?.description || error.message || "";
    throw new Error(`Razorpay Payout Creation Failed: ${message}`);
  }
};
