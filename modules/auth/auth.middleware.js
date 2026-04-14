import jwt from 'jsonwebtoken';

/**
 * auth(roles)
 * ───────────
 * @param {string | string[]} roles  - Required role(s). e.g. 'teacher' or ['teacher', 'student']
 *
 * Fixes from original:
 *  1. Now uses process.env.JWT_SECRET instead of hardcoded 'secret'
 *  2. Supports multiple allowed roles
 *  3. Token is read from Authorization header (Bearer <token>) OR req.headers.token
 *     for backward compatibility
 */
export const auth = (roles) => (req, res, next) => {
  // Support both "Authorization: Bearer <token>" and plain "token" header
  let token =
    req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.headers.token;

  if (!token) {
    return res.status(401).json({
      messageEng: 'Access denied. Please sign in.',
      messageAr: 'الوصول مرفوض. يرجى تسجيل الدخول.',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        messageEng: 'Invalid or expired token. Please sign in again.',
        messageAr: 'الرمز غير صالح أو منتهي الصلاحية.',
      });
    }

    // Normalize roles to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({
        messageEng: 'You do not have permission to access this resource.',
        messageAr: 'ليس لديك صلاحية للوصول إلى هذا المورد.',
      });
    }

    req.user = decoded;
    next();
  });
};
