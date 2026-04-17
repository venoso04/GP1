import nodemailer from 'nodemailer'; import dotenv from 'dotenv'; dotenv.config();  const transporter = nodemailer.createTransport({     service: 'gmail',      auth: {         user: process.env.GMAIL_USER,         pass: process.env.GMAIL_PASSWORD     } });  const sendEmail = async ({ to, subject, message }) => {     try {         await transporter.sendMail({             from: process.env.GMAIL_USER,             to,             subject,             html: message         });         return true;     } catch (error) {         console.error('Error sending email:', error.response || error.message);          return false;     } };   export default sendEmail; 

import { Router } from "express";
import { signin, signup, verifyAccount } from "./auth.controllers.js";
export const authRouter = Router()
authRouter.post('/sign-up', signup)
authRouter.post('/sign-in', signin)
authRouter.get('/verify-account', verifyAccount);

