import nodemailer from "nodemailer";

let transporter;

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

export const sendPasswordResetEmail = async ({ to, otp, userType }) => {
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

export const sendEmailVerificationOtp = async ({ to, otp, userType }) => {
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

export const sendInvoiceEmail = async ({ to, payout, educator, pdfBuffer }) => {
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

export const sendBankDetailsUpdatedEmail = async ({ to, educator }) => {
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
