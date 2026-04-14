import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, message }) => {
  try {
    await transporter.sendMail({
      from: `"Edu App" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: message,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error.response || error.message);
    return false;
  }
};

export default sendEmail;
