import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import './db/connection.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { groupRouter } from './modules/groups/group.routes.js';
import { taskRouter } from './modules/tasks/task.routes.js';
import { quizRouter } from './modules/quizzes/quiz.routes.js';
import { rewardRouter } from './modules/rewards/reward.routes.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.use('/auth', authRouter);
app.use('/groups', groupRouter);
app.use('/tasks', taskRouter);
app.use('/quizzes', quizRouter);
app.use('/rewards', rewardRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    messageEng: err.message || 'Internal server error',
  });
});

app.get('/', (req, res) => res.json({ message: 'Edu App API is running 🚀' }));

app.listen(port, () => console.log(`✅ Server listening on port ${port}`));