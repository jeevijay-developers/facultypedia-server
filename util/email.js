/**
 * Email utility module
 * Primary: Resend
 * Fallback: Nodemailer (SMTP)
 */

import nodemailer from "nodemailer";
import * as resendService from "../services/resend.service.js";

let transporter;

// Check if Resend is configured
const isResendConfigured = () => {
  return !!process.env.RESEND_API_KEY;
};

// ============================================================
// Nodemailer fallback functions (legacy SMTP)
// ============================================================

const getSmtpConfig = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ADMIN_EMAIL } =
    process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP configuration is missing");
  }

  const portNumber = Number(SMTP_PORT) || 587;

  return {
    from: SMTP_FROM || SMTP_USER,
    cc: ADMIN_EMAIL || "admin@facultypedia.com",
    transportOptions: {
      host: SMTP_HOST,
      port: portNumber,
      secure: portNumber === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    },
  };
};

const getTransporter = () => {
  if (!transporter) {
    const { transportOptions } = getSmtpConfig();
    transporter = nodemailer.createTransport(transportOptions);
  }
  return transporter;
};

const sendPasswordResetEmailLegacy = async ({ to, otp, userType }) => {
  const { from } = getSmtpConfig();
  const mailer = getTransporter();
  const subject = "Reset your FacultyPedia password";
  const text = `Hi,

We received a request to reset your ${userType} account password.

Your one-time password (OTP) is: ${otp}

This OTP expires in 5 minutes. If you did not request this, you can ignore this email.

Thanks,
FacultyPedia Team`;

  return mailer.sendMail({ from, to, subject, text });
};

const sendEmailVerificationOtpLegacy = async ({ to, otp, userType }) => {
  const { from } = getSmtpConfig();
  const mailer = getTransporter();
  const subject = "Verify your FacultyPedia email";

  const text = `Hi,

Welcome to FacultyPedia! Please verify your ${userType} account email.

Your one-time verification code is: ${otp}

This code expires in 10 minutes. If you did not sign up, you can ignore this email.

Thanks,
FacultyPedia Team`;

  return mailer.sendMail({ from, to, subject, text });
};

const sendInvoiceEmailLegacy = async ({ to, payout, educator, pdfBuffer }) => {
  const { from } = getSmtpConfig();
  const mailer = getTransporter();
  const subject = `Payout Invoice - ${
    payout?.payoutCheckId || payout?._id || ""
  }`;

  const text = `Hi ${educator?.fullName || "Educator"},

Your payout has been processed successfully.
Reference: ${payout?.payoutCheckId || ""}
Period: ${payout?.month}/${payout?.year}
Amount: Rs ${(Number(payout?.amount || 0) / 100).toFixed(2)}

The invoice is attached for your records.

Thanks,
FacultyPedia Team`;

  const attachments = pdfBuffer
    ? [
        {
          filename: `${payout?.payoutCheckId || "payout"}-invoice.pdf`,
          content: pdfBuffer,
        },
      ]
    : [];

  return mailer.sendMail({ from, to, subject, text, attachments });
};

const sendBankDetailsUpdatedEmailLegacy = async ({ to, educator }) => {
  const { from, cc } = getSmtpConfig();
  const mailer = getTransporter();
  const subject = "Security Alert: Bank Details Updated";

  const text = `Hi ${educator?.fullName || "Educator"},

This is a security notification to inform you that your bank account details for payouts were updated on ${new Date().toLocaleString()}.

If you made this change, you can ignore this email.

Account Holder: ${educator.bankDetails.accountHolderName}
Bank: ${educator.bankDetails.bankName}
Account Number: XXXX${educator.bankDetails.accountNumber.slice(-4)}

IF YOU DID NOT AUTHORIZE THIS CHANGE, please contact support immediately to freeze your payouts.

Thanks,
FacultyPedia Security Team`;

  return mailer.sendMail({ from, to, cc, subject, text });
};

// ============================================================
// Exported functions with Resend primary, Nodemailer fallback
// ============================================================

export const sendPasswordResetEmail = async ({ to, otp, userType }) => {
  if (isResendConfigured()) {
    try {
      return await resendService.sendPasswordResetOtp({ to, otp, userType });
    } catch (error) {
      console.warn("Resend failed, falling back to nodemailer:", error.message);
    }
  }
  return sendPasswordResetEmailLegacy({ to, otp, userType });
};

export const sendEmailVerificationOtp = async ({ to, otp, userType }) => {
  if (isResendConfigured()) {
    try {
      return await resendService.sendEmailVerificationOtp({ to, otp, userType });
    } catch (error) {
      console.warn("Resend failed, falling back to nodemailer:", error.message);
    }
  }
  return sendEmailVerificationOtpLegacy({ to, otp, userType });
};

export const sendInvoiceEmail = async ({ to, payout, educator, pdfBuffer }) => {
  if (isResendConfigured()) {
    try {
      return await resendService.sendPayoutInvoiceEmail({ to, payout, educator, pdfBuffer });
    } catch (error) {
      console.warn("Resend failed, falling back to nodemailer:", error.message);
    }
  }
  return sendInvoiceEmailLegacy({ to, payout, educator, pdfBuffer });
};

export const sendBankDetailsUpdatedEmail = async ({ to, educator }) => {
  if (isResendConfigured()) {
    try {
      return await resendService.sendBankDetailsUpdatedNotification({ to, educator });
    } catch (error) {
      console.warn("Resend failed, falling back to nodemailer:", error.message);
    }
  }
  return sendBankDetailsUpdatedEmailLegacy({ to, educator });
};

// Generic email sender
export const sendEmail = async (options) => {
  if (isResendConfigured()) {
    try {
      return await resendService.sendEmail(options);
    } catch (error) {
      console.warn("Resend failed, falling back to nodemailer:", error.message);
    }
  }
  
  const { from } = getSmtpConfig();
  const mailer = getTransporter();
  return mailer.sendMail({ from, ...options });
};
