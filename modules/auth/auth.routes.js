import { Router } from "express";
import { signin, signup } from "./auth.controllers.js";

export const authRouter = Router()

authRouter.post('/sign-up', signup)
authRouter.post('/sign-in', signin)