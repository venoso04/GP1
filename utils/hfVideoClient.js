import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const HF_VIDEO_URL =
  process.env.HF_VIDEO_URL || 'https://fiby-ehab26-videosummary.hf.space';

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE SECTION
// ─────────────────────────────────────────────────────────────────────────────
// This is the only block you need to update once you confirm the HF API shape.
//
// To confirm the shape:
//   1. Open https://fiby-ehab26-videosummary.hf.space/docs in your browser
//   2. Expand the POST endpoint, click "Try it out", upload a short video
//   3. Copy the Response Body and update the three values below:
//
//   HF_ENDPOINT    — the path after the domain, e.g. "/Upload_Video"
//   REQUEST_FIELD  — the form-data field name the API expects, e.g. "file"
//   parseResponse  — map the raw API response to { summaryText, transcriptText }
//
const HF_ENDPOINT = '/Upload_Video'; // <-- UPDATE if different

const REQUEST_FIELD = 'file'; // <-- UPDATE if different

/**
 * parseResponse
 * Maps the raw HF API response body to a normalised shape.
 * Update the field names on the right-hand side to match what the API returns.
 *
 * Common shapes seen across HF spaces:
 *   { summary: "...", transcript: "..." }
 *   { summary_text: "...", transcription: "..." }
 *   { result: "..." }
 *   "plain string"
 */
const parseResponse = (data) => {
  const summaryText =
    data?.summary ||       // <-- UPDATE: primary summary field name
    data?.summary_text ||
    data?.result ||
    data?.text ||
    (typeof data === 'string' ? data : null);

  const transcriptText =
    data?.transcript ||    // <-- UPDATE: transcript field name, or remove if unused
    data?.transcription ||
    data?.transcript_text ||
    null;

  return { summaryText, transcriptText };
};
// ─────────────────────────────────────────────────────────────────────────────
// END TEMPLATE SECTION — nothing below this line should need to change
// ─────────────────────────────────────────────────────────────────────────────

/**
 * summarizeVideo
 * Sends a video file to the HF video summarizer API.
 *
 * @param {string} filePath        - Absolute path to the uploaded file on disk
 * @param {string} originalFileName - Original name of the file (for the multipart boundary)
 * @returns {{ summaryText: string, transcriptText: string|null }}
 * @throws on network error, timeout, or unexpected response shape
 */
export const summarizeVideo = async (filePath, originalFileName) => {
  const form = new FormData();

  form.append(REQUEST_FIELD, fs.createReadStream(filePath), {
    filename: originalFileName,
  });

  const response = await axios.post(`${HF_VIDEO_URL}${HF_ENDPOINT}`, form, {
    headers: { ...form.getHeaders() },
    // Video processing is slower than audio — allow up to 5 minutes
    timeout: 300_000,
  });

  const { summaryText, transcriptText } = parseResponse(response.data);

  if (!summaryText) {
    throw new Error(
      `HF video API returned an unexpected response shape: ${JSON.stringify(response.data)}`
    );
  }

  return { summaryText, transcriptText };
};
