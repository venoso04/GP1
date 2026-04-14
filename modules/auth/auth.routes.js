import { Router } from 'express';
import { signin, signup, verifyAccount, getMe } from './auth.controllers.js';
import { auth } from './auth.middleware.js';

export const authRouter = Router();

authRouter.post('/sign-up', signup);
authRouter.post('/sign-in', signin);
authRouter.get('/verify-account', verifyAccount);
authRouter.get('/me', auth(['teacher', 'student']), getMe);
