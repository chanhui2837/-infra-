import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

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
