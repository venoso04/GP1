/**
 * seed-teachers.js
 * ─────────────────
 * Run this once to whitelist teacher emails before they sign up.
 *
 * Usage:
 *   node seed-teachers.js
 *
 * Add as many emails as needed to the TEACHER_EMAILS array below.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import AllowedTeacherEmail from './db/models/allowedTeacherEmail.model.js';

const TEACHER_EMAILS = [
  'teacher1@school.com',
  'teacher2@school.com',
  // add more here
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  let added = 0;
  let skipped = 0;

  for (const email of TEACHER_EMAILS) {
    const normalized = email.toLowerCase().trim();
    const exists = await AllowedTeacherEmail.findOne({ email: normalized });

    if (exists) {
      console.log(`⏭  Already whitelisted: ${normalized}`);
      skipped++;
    } else {
      await AllowedTeacherEmail.create({ email: normalized, addedBy: 'seed' });
      console.log(`✅ Whitelisted: ${normalized}`);
      added++;
    }
  }

  console.log(`\n Done. ${added} added, ${skipped} skipped.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
