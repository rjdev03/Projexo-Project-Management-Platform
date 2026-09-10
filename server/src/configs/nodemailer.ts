import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io";
const port = Number(process.env.SMTP_PORT) || 465;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const senderEmail = process.env.SENDER_EMAIL || "no-reply@projexo.com";

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  tls: {
    rejectUnauthorized: false,
  },
});

if (process.env.NODE_ENV !== "production" && smtpUser && smtpPass) {
  transporter.verify((error) => {
    if (error) {
      console.error("❌ Mailtrap SMTP connection error:", error.message);
    } else {
      console.log("✅ Mailtrap SMTP ready to send emails");
    }
  });
}

const sendEmail = async (to: string, subject: string, body: string) => {
  try {
    const info = await transporter.sendMail({
      from: senderEmail,
      to,
      subject,
      html: body,
    });
    console.log(`✉️ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
};

export default sendEmail;