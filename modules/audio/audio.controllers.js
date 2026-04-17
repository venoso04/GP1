import FormData from 'form-data';
import fetch from 'node-fetch';
import multer from 'multer';
import AudioSummary from '../../db/models/audioSummary.model.js';

// Multer config — store in memory, audio files only, max 50MB
const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_AUDIO_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Please upload an audio file (mp3, wav, m4a, ogg, flac, webm).'),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

const HF_API_URL = 'https://fiby-ehab26-audio-summarizer-api.hf.space/Upload_Audio';

// POST /audio/summarize — upload audio and get a summary
export const summarizeAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        messageEng: 'Please upload an audio file',
        messageAr: 'يرجى رفع ملف صوتي',
      });
    }

    // Forward the audio buffer to the HuggingFace API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const hfResponse = await fetch(HF_API_URL, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      console.error('HuggingFace API error:', errText);
      return res.status(502).json({
        messageEng: 'Audio summarization service failed. Please try again later.',
        messageAr: 'فشل في الحصول على الملخص، يرجى المحاولة لاحقاً',
      });
    }

    const summary = await hfResponse.json(); // Returns a string per the docs

    // Persist the summary linked to the student
    const record = await AudioSummary.create({
      student: req.user.id,
      originalFileName: req.file.originalname,
      summary: typeof summary === 'string' ? summary : JSON.stringify(summary),
    });

    return res.status(201).json({
      messageEng: 'Audio summarized successfully',
      messageAr: 'تم تلخيص الملف الصوتي بنجاح',
      summary: record.summary,
      record,
    });
  } catch (error) {
    console.error('summarizeAudio error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /audio/history — get student's past summaries
export const getAudioHistory = async (req, res) => {
  try {
    const records = await AudioSummary.find({ student: req.user.id }).sort({ createdAt: -1 });
    return res.json({ records });
  } catch (error) {
    console.error('getAudioHistory error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
