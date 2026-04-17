import { Router } from 'express';
import { auth } from '../../middleware/auth.middleware.js';
import { summarizeAudio, getAudioHistory, upload } from './audio.controllers.js';

export const audioRouter = Router();

audioRouter.use(auth);

// POST /audio/summarize — multipart/form-data with field name "file"
audioRouter.post('/summarize', upload.single('file'), summarizeAudio);

// GET /audio/history — list past summaries for the logged-in student
audioRouter.get('/history', getAudioHistory);
