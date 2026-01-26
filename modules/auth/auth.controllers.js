import User from "../../db/models/user.model.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import sendEmail from "../../utils/sendEmail.js";


export const signup = async (req,res) => {
     // retreive data
     const {email,password,name} = req.body

     // // check if student is enrolled in HTI, if not return error
     // if (!email.trim().toLowerCase().endsWith('@hti.edu.eg')) {
     // return res.status(400).json({ messageEng: 'You are not allowed to sign up'  , messageAr: 'غير مسموح لك بالتسجيل' });
     // }

     // check for user existence
     const user = await User.findOne({email})
     if (user) return res.status(400).json({messageEng:'Email already exists', messageAr: 'البريد الإلكتروني موجود بالفعل'})
     
     // hash pass 
     const hashed = bcrypt.hashSync(password, 5 )

     // create user
     await User.create({email, name,password:hashed}) 

          // send verification email
     const token = jwt.sign({ email }, process.env.JWT_SECRET, {
     expiresIn: "1d",
     });
     
     const verificationUrl = `${req.protocol}://${req.headers.host}/auth/verify-account?token=${token}`;
     const emailMessage = `
     <p>If you have registered with your email, click here to verify your account: 
     <a href="${verificationUrl}">Verify your account</a></p>
     `;

     const emailSent = await sendEmail({
     to: email,
     subject: "Verify your account",
     message: emailMessage,
     });

     if (!emailSent) {
     return next(new AppError("Email could not be sent", 500));
     }


     res.status(201).json({messageEng:'Signed up successfully, please check your email for verification', messageAr: 'تم التسجيل بنجاح, يرجى التحقق من بريدك الإلكتروني'})
}

export const signin = async (req, res) => {
  // extract data
  const { email, password } = req.body;

  // check user exists
  const user = await User.findOne({ email });

  // Return early if user doesn't exist
  if (!user) {
    return res.status(400).json({
      messageEng: 'Invalid Credentials',
      messageAr: 'البيانات غير صحيحة'
    });
  }

  // compare passwords (only after confirming user exists)
  const isMatch = bcrypt.compareSync(password, user.password);

  if (!isMatch) {
    return res.status(400).json({
      messageEng: 'Invalid Credentials',
      messageAr: 'البيانات غير صحيحة'
    });
  }

  // Check if user is verified 
  if (!user.emailConfirmed) {
    return res.status(400).json({
      messageEng: 'Please verify your email first',
      messageAr: 'يرجى التحقق من بريدك الإلكتروني أولاً'
    });
  }

  // assign token
  const token = jwt.sign(
    { id: user._id, name: user.name, email, role: user.role },
    process.env.JWT_SECRET, 
    { expiresIn: '7d' } 
  );

  res.json({ token });
};

export const verifyAccount = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        messageEng: 'Verification token is missing',
        messageAr: 'رمز التحقق مفقود'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;

    // Find and update the user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        messageEng: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    if (user.emailConfirmed === true) {
      return res.status(400).json({
        messageEng: 'Account already verified',
        messageAr: 'الحساب تم التحقق منه بالفعل'
      });
    }

    // Update user verification status
    user.emailConfirmed = true;
    await user.save();

    res.status(200).json({
      messageEng: 'Account verified successfully',
      messageAr: 'تم التحقق من الحساب بنجاح'
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        messageEng: 'Verification link has expired',
        messageAr: 'انتهت صلاحية رابط التحقق'
      });
    }

    return res.status(400).json({
      messageEng: 'Invalid verification token',
      messageAr: 'رمز التحقق غير صالح'
    });
  }
};