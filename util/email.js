/**
 * Email utility module
 * Uses Resend as the email provider
 */

import * as resendService from "../services/resend.service.js";

// Check if Resend is configured
const checkResendConfigured = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured. Email cannot be sent.");
  }
};

// ============================================================
// Exported email functions using Resend
// ============================================================

export const sendPasswordResetEmail = async ({ to, otp, userType }) => {
  checkResendConfigured();
  return resendService.sendPasswordResetOtp({ to, otp, userType });
};

export const sendEmailVerificationOtp = async ({ to, otp, userType }) => {
  checkResendConfigured();
  console.log(`[Email] Sending verification OTP to ${to} (${userType})`);
  const result = await resendService.sendEmailVerificationOtp({ to, otp, userType });
  console.log(`[Email] Resend success for ${to}:`, result);
  return result;
};

export const sendInvoiceEmail = async ({ to, payout, educator, pdfBuffer }) => {
  checkResendConfigured();
  return resendService.sendPayoutInvoiceEmail({ to, payout, educator, pdfBuffer });
};

export const sendBankDetailsUpdatedEmail = async ({ to, educator }) => {
  checkResendConfigured();
  return resendService.sendBankDetailsUpdatedNotification({ to, educator });
};

// Generic email sender
export const sendEmail = async (options) => {
  checkResendConfigured();
  return resendService.sendEmail(options);
};
