import User from '../../db/models/user.model.js';
import AllowedTeacherEmail from '../../db/models/allowedTeacherEmail.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail from '../../utils/sendEmail.js';

// ─── SIGN UP ────────────────────────────────────────────────────────────────
export const signup = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Validate role
    const requestedRole = role === 'teacher' ? 'teacher' : 'student';

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        messageEng: 'Email already exists',
        messageAr: 'البريد الإلكتروني موجود بالفعل',
      });
    }

    // If requesting teacher role, verify email is whitelisted
    if (requestedRole === 'teacher') {
      const isAllowed = await AllowedTeacherEmail.findOne({
        email: email.toLowerCase().trim(),
      });
      if (!isAllowed) {
        return res.status(403).json({
          messageEng: 'This email is not authorized to register as a teacher.',
          messageAr: 'هذا البريد الإلكتروني غير مصرح له بالتسجيل كمعلم.',
        });
      }
    }

    // Hash password
    const hashed = bcrypt.hashSync(password, 10);

    // Create user
    await User.create({ email, name, password: hashed, role: requestedRole });

    // Send verification email
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const verificationUrl = `${req.protocol}://${req.headers.host}/auth/verify-account?token=${token}`;
    const emailMessage = `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Welcome to Edu App 🎓</h2>
        <p>Hi <strong>${name}</strong>, you registered as a <strong>${requestedRole}</strong>.</p>
        <p>Please verify your email address to activate your account:</p>
        <a href="${verificationUrl}" style="
          display: inline-block; padding: 12px 24px; background: #4F46E5;
          color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Verify Account
        </a>
        <p style="margin-top: 16px; color: #888;">This link expires in 24 hours.</p>
      </div>
    `;

    const emailSent = await sendEmail({
      to: email,
      subject: 'Verify your Edu App account',
      message: emailMessage,
    });

    if (!emailSent) {
      // User created but email failed — still return success, don't block signup
      console.warn(`Verification email failed for ${email}`);
    }

    res.status(201).json({
      messageEng: 'Signed up successfully. Please check your email to verify your account.',
      messageAr: 'تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني.',
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ messageEng: 'Server error during signup.' });
  }
};

// ─── SIGN IN ────────────────────────────────────────────────────────────────
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        messageEng: 'Invalid credentials',
        messageAr: 'البيانات غير صحيحة',
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        messageEng: 'Invalid credentials',
        messageAr: 'البيانات غير صحيحة',
      });
    }

    if (!user.emailConfirmed) {
      return res.status(400).json({
        messageEng: 'Please verify your email first.',
        messageAr: 'يرجى التحقق من بريدك الإلكتروني أولاً.',
      });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        coins: user.coins,
      },
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ messageEng: 'Server error during signin.' });
  }
};

// ─── VERIFY ACCOUNT ─────────────────────────────────────────────────────────
export const verifyAccount = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        messageEng: 'Verification token is missing.',
        messageAr: 'رمز التحقق مفقود.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        messageEng: 'User not found.',
        messageAr: 'المستخدم غير موجود.',
      });
    }

    if (user.emailConfirmed) {
      return res.status(400).json({
        messageEng: 'Account already verified.',
        messageAr: 'الحساب تم التحقق منه بالفعل.',
      });
    }

    user.emailConfirmed = true;
    await user.save();

    res.status(200).json({
      messageEng: 'Account verified successfully. You can now sign in.',
      messageAr: 'تم التحقق من الحساب بنجاح. يمكنك الآن تسجيل الدخول.',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        messageEng: 'Verification link has expired.',
        messageAr: 'انتهت صلاحية رابط التحقق.',
      });
    }
    return res.status(400).json({
      messageEng: 'Invalid verification token.',
      messageAr: 'رمز التحقق غير صالح.',
    });
  }
};

// ─── GET CURRENT USER (me) ───────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('group', 'name teacher');

    if (!user) return res.status(404).json({ messageEng: 'User not found.' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ messageEng: 'Server error.' });
  }
};
