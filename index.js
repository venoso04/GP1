import express from 'express';
import './db/connection.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { taskRouter } from './modules/task/task.routes.js';
import { audioRouter } from './modules/audio/audio.routes.js';
import { videoSummaryRouter } from './modules/video/videoSummary.routes.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/tasks', taskRouter);
app.use('/audio', audioRouter);
app.use('/video-summaries', videoSummaryRouter);


app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`listening on port ${port}!`));