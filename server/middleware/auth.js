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

// 진행내역 삭제 권한을 가진 사번
export const DELETER_NNUMBER = 'N1101924';

// 진행내역 삭제는 지정된 사번만 가능 (requireAuth 뒤에 사용)
export function requireDeleter(req, res, next) {
  if (req.user?.nnumber !== DELETER_NNUMBER) {
    return res.status(403).json({ error: '진행내역 삭제는 관리자(N1101924)만 할 수 있습니다.' });
  }
  next();
}

// 회원가입 승인 권한을 가진 사번 (수신함 담당)
export const APPROVER_NNUMBER = DELETER_NNUMBER;

export function requireApprover(req, res, next) {
  if (req.user?.nnumber !== APPROVER_NNUMBER) {
    return res.status(403).json({ error: `수신함은 ${APPROVER_NNUMBER} 사용자만 사용할 수 있습니다.` });
  }
  next();
}
