import mongoose from 'mongoose';

/**
 * AllowedTeacherEmail
 * ───────────────────
 * A simple whitelist. Any email present in this collection is allowed
 * to register as a teacher. Entries can be seeded manually or via an
 * admin endpoint (to be built later).
 *
 * Usage:
 *   db.allowedteacheremails.insertOne({ email: "teacher@school.com" })
 */
const allowedTeacherEmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    addedBy: {
      type: String,
      default: 'admin',
    },
  },
  { timestamps: true }
);

const AllowedTeacherEmail = mongoose.model('AllowedTeacherEmail', allowedTeacherEmailSchema);
export default AllowedTeacherEmail;
