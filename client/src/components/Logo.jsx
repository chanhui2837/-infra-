import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

// SK오엔에스 스타일 로고 (행복날개 모티브 + 워드마크)
export default function Logo({ size = 34 }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="skWing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EA002C" />
            <stop offset="100%" stopColor="#F58220" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="15" fill="url(#skWing)" />
        <path d="M32 13c6.4 6.4 6.4 12.8 0 19.2-6.4-6.4-6.4-12.8 0-19.2Z" fill="#fff" opacity="0.95" />
        <path d="M13 32c6.4-6.4 12.8-6.4 19.2 0-6.4 6.4-12.8 6.4-19.2 0Z" fill="#fff" opacity="0.8" />
        <path d="M51 32c-6.4-6.4-12.8-6.4-19.2 0 6.4 6.4 12.8 6.4 19.2 0Z" fill="#fff" opacity="0.8" />
        <path d="M32 51c-6.4-6.4-6.4-12.8 0-19.2 6.4 6.4 6.4 12.8 0 19.2Z" fill="#fff" opacity="0.95" />
      </svg>
      <span className="logo-text">
        <b>SK</b><i>oN</i>
        <em>Infra 진행관리</em>
      </span>
    </span>
  );
}

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const menus = [
    { to: '/', label: '실적 총괄' },
    { to: '/trips', label: '차단기 트립' },
    { to: '/revisions', label: 'DORS415 리비전' },
    { to: '/gallery', label: '공유 갤러리' },
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
