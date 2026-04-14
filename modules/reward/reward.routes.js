import { Router } from 'express';
import { auth } from '../auth/auth.middleware.js';
import { getMyCoins } from './reward.controllers.js';

export const rewardRouter = Router();

rewardRouter.get('/my-coins', auth('student'), getMyCoins);
