import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod';

export function signToken(user) {
  return jwt.sign(
    { uid: user._id.toString(), nnumber: user.nnumber, name: user.name },
    SECRET,
    { expiresIn: '30d' }
  );
}

// Authorization: Bearer <token> 검증
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: '세션이 만료되었습니다. 다시 로그인해 주세요.' });
  }
}
