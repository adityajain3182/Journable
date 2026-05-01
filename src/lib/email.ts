import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID ?? "";
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID ?? "";
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY ?? "";

/**
 * Sends a one-time password to the given email address via EmailJS.
 *
 * Your EmailJS template must contain these variables:
 *   {{to_email}}   — recipient address
 *   {{otp_code}}   — the 6-digit code
 *   {{app_name}}   — "Journable"
 *
 * Set the template's "To Email" field to {{to_email}}.
 */
export async function sendOTPEmail(toEmail: string, otpCode: string): Promise<void> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error(
      "EmailJS is not configured. Add EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PUBLIC_KEY to your .env file."
    );
  }

  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email: toEmail,
      otp_code: otpCode,
      app_name: "Journable",
    },
    PUBLIC_KEY
  );
}
