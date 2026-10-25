import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, APPROVER_NNUMBER } from '../auth.jsx';
import { api } from '../api.js';

// SK오엔에스 로고
export default function Logo({ size = 34 }) {
  return (
    <span className="logo">
      <img className="logo-img" src="/sk-logo.png" alt="SK오엔에스" style={{ height: size }} />
    </span>
  );
}

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isApprover = user?.nnumber === APPROVER_NNUMBER;
  const [pending, setPending] = useState(0);

  // 수신함 뱃지: 대기 중 가입 요청 건수 (30초마다 갱신)
  useEffect(() => {
    if (!isApprover) return undefined;
    let alive = true;
    const tick = () => api('/inbox/count').then((d) => alive && setPending(d.pending)).catch(() => {});
    tick();
    const t = setInterval(tick, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [isApprover, pathname]);

  const menus = [
    { to: '/', label: '실적 총괄' },
    { to: '/trips', label: '차단기 트립' },
    { to: '/revisions', label: 'DORS415 리비전' },
    { to: '/gallery', label: '공유 갤러리' },
    ...(isApprover ? [{ to: '/inbox', label: '수신함', badge: pending }] : []),
  ];

  return (
    <header className="topbar">
      <div className="topbar-left" onClick={() => navigate('/')} role="button">
        <Logo />
      </div>
      <nav className="topbar-nav">
        {menus.map((m) => (
          <button
            key={m.to}
            className={pathname === m.to ? 'nav-item active' : 'nav-item'}
            onClick={() => navigate(m.to)}
          >
            {m.label}
            {m.badge > 0 && <span className="nav-badge">{m.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="topbar-right">
        {user && (
          <span className="who">
            <b>{user.name}</b>
            <small>{user.nnumber}</small>
          </span>
        )}
        <button className="btn ghost" onClick={() => { logout(); navigate('/login'); }}>
          로그아웃
        </button>
      </div>
    </header>
  );
}
