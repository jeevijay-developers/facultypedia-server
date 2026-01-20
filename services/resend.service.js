import { Resend } from "resend";

let resendClient = null;

const getResendClient = () => {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

const getFromEmail = () => {
  return process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
};

/**
 * Send password reset OTP email
 */
export const sendPasswordResetOtp = async ({ to, otp, userType }) => {
  const resend = getResendClient();
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">FacultyPedia</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          We received a request to reset your <strong>${userType}</strong> account password.
        </p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
          <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your one-time password (OTP) is:</p>
          <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${otp}
          </div>
        </div>
        <p style="color: #888; font-size: 14px;">
          ⏰ This OTP expires in <strong>5 minutes</strong>.
        </p>
        <p style="color: #888; font-size: 14px;">
          If you did not request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} FacultyPedia. All rights reserved.
        </p>
      </div>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to,
    subject: "Reset your FacultyPedia password",
    html,
  });

  if (error) {
    console.error("Resend error (password reset):", error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  return data;
};

/**
 * Send email verification OTP
 */
export const sendEmailVerificationOtp = async ({ to, otp, userType }) => {
  const resend = getResendClient();
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">FacultyPedia</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Welcome to FacultyPedia! Please verify your <strong>${userType}</strong> account email address.
        </p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
          <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your verification code is:</p>
          <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${otp}
          </div>
        </div>
        <p style="color: #888; font-size: 14px;">
          ⏰ This code expires in <strong>10 minutes</strong>.
        </p>
        <p style="color: #888; font-size: 14px;">
          If you did not sign up for FacultyPedia, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} FacultyPedia. All rights reserved.
        </p>
      </div>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to,
    subject: "Verify your FacultyPedia email",
    html,
  });

  if (error) {
    console.error("Resend error (email verification):", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }

  return data;
};

/**
 * Send payout invoice email with PDF attachment
 */
export const sendPayoutInvoiceEmail = async ({ to, payout, educator, pdfBuffer }) => {
  const resend = getResendClient();
  
  const amountFormatted = (Number(payout?.amount || 0) / 100).toFixed(2);
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">FacultyPedia</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Payout Processed Successfully</p>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${educator?.fullName || "Educator"},</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Great news! Your payout has been processed successfully.
        </p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #666; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">Reference:</td>
              <td style="color: #333; font-weight: bold; padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${payout?.payoutCheckId || payout?._id || "N/A"}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">Period:</td>
              <td style="color: #333; font-weight: bold; padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${payout?.month}/${payout?.year}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 8px 0;">Amount:</td>
              <td style="color: #11998e; font-weight: bold; font-size: 20px; padding: 8px 0; text-align: right;">₹${amountFormatted}</td>
            </tr>
          </table>
        </div>
        <p style="color: #555; font-size: 14px;">
          📎 The invoice is attached to this email for your records.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} FacultyPedia. All rights reserved.
        </p>
      </div>
    </div>
  `;

  const emailPayload = {
    from: getFromEmail(),
    to,
    subject: `Payout Invoice - ${payout?.payoutCheckId || payout?._id || ""}`,
    html,
  };

  if (pdfBuffer) {
    emailPayload.attachments = [
      {
        filename: `${payout?.payoutCheckId || "payout"}-invoice.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ];
  }

  const { data, error } = await resend.emails.send(emailPayload);

  if (error) {
    console.error("Resend error (payout invoice):", error);
    throw new Error(`Failed to send invoice email: ${error.message}`);
  }

  return data;
};

/**
 * Send bank details updated notification
 */
export const sendBankDetailsUpdatedNotification = async ({ to, educator }) => {
  const resend = getResendClient();
  const adminEmail = process.env.ADMIN_EMAIL || "admin@facultypedia.com";
  
  const maskedAccount = educator?.bankDetails?.accountNumber
    ? `XXXX${educator.bankDetails.accountNumber.slice(-4)}`
    : "N/A";

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Security Alert</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${educator?.fullName || "Educator"},</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          This is a security notification to inform you that your bank account details for payouts were updated on <strong>${new Date().toLocaleString()}</strong>.
        </p>
        <div style="background: #fff3f3; border: 1px solid #ffcdd2; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #666; padding: 8px 0;">Account Holder:</td>
              <td style="color: #333; font-weight: bold; padding: 8px 0; text-align: right;">${educator?.bankDetails?.accountHolderName || "N/A"}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 8px 0;">Bank:</td>
              <td style="color: #333; font-weight: bold; padding: 8px 0; text-align: right;">${educator?.bankDetails?.bankName || "N/A"}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 8px 0;">Account Number:</td>
              <td style="color: #333; font-weight: bold; padding: 8px 0; text-align: right;">${maskedAccount}</td>
            </tr>
          </table>
        </div>
        <p style="color: #555; font-size: 14px;">
          ✅ If you made this change, you can ignore this email.
        </p>
        <p style="color: #d32f2f; font-size: 14px; font-weight: bold;">
          ⚠️ IF YOU DID NOT AUTHORIZE THIS CHANGE, please contact support immediately to freeze your payouts.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} FacultyPedia Security Team
        </p>
      </div>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: [to, adminEmail],
    subject: "Security Alert: Bank Details Updated",
    html,
  });

  if (error) {
    console.error("Resend error (bank details):", error);
    throw new Error(`Failed to send bank details notification: ${error.message}`);
  }

  return data;
};

/**
 * Generic email sender
 */
export const sendEmail = async ({ to, subject, html, text, attachments }) => {
  const resend = getResendClient();
  
  const emailPayload = {
    from: getFromEmail(),
    to,
    subject,
  };

  if (html) {
    emailPayload.html = html;
  } else if (text) {
    emailPayload.text = text;
  }

  if (attachments && attachments.length > 0) {
    emailPayload.attachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content.toString("base64"),
    }));
  }

  const { data, error } = await resend.emails.send(emailPayload);

  if (error) {
    console.error("Resend error (generic):", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
};
