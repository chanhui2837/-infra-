import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import Logo from '../components/Logo.jsx';

const NN_RE = /^N\d{7}$/;

export default function Login() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // login | signup
  const [nnumber, setNnumber] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setInfo('');
    const nn = nnumber.trim().toUpperCase();
    if (!NN_RE.test(nn)) {
      setErr('사번은 N + 숫자 7자리 형식이어야 합니다. (예: N1101924)');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setErr('이름을 입력해 주세요.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') await login(nn);
      else {
        const r = await signup(name.trim(), nn);
        if (r.pending) {
          setInfo(r.message);
          setName('');
          setMode('login');
        }
      }
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <Logo size={44} />
        </div>
        <h1>Infra 설비개선 진행관리</h1>
        <p className="sub">춘천품질개선팀 · 차단기 트립 / DORS415 리비전 진행내역 공유 시스템</p>

        <div className="tabs">
          <button className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => { setMode('login'); setErr(''); setInfo(''); }}>
            로그인
          </button>
          <button className={mode === 'signup' ? 'tab active' : 'tab'} onClick={() => { setMode('signup'); setErr(''); setInfo(''); }}>
            회원가입
          </button>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          {mode === 'signup' && (
            <label className="field">
              <span className="field-label">이름</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름만 입력하면 가입됩니다"
                autoComplete="name"
              />
            </label>
          )}

          <label className="field">
            <span className="field-label">사번</span>
            <input
              value={nnumber}
              onChange={(e) => setNnumber(e.target.value.toUpperCase())}
              placeholder="N1101924"
              maxLength={8}
              autoComplete="username"
            />
          </label>

          {err && <div className="error-text">{err}</div>}
          {info && <div className="info-text">{info}</div>}

          <button className="btn primary block" disabled={busy}>
            {busy ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <p className="hint">
          {mode === 'login'
            ? '사번(N + 숫자 7자리)만 입력하면 로그인됩니다.'
            : '이름과 사번만 입력하면 가입 요청이 전송되며, 관리자(N1101924)의 승인 후 로그인할 수 있습니다.'}
        </p>
      </div>
    </div>
  );
}
