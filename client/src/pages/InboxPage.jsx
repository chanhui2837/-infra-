import { useEffect, useState } from 'react';
import { api } from '../api.js';

const fmt = (d) => (d ? new Date(d).toLocaleString('ko-KR', { hour12: false }) : '');

export default function InboxPage() {
  const [data, setData] = useState({ pending: [], done: [] });
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    const d = await api('/inbox');
    setData(d);
  };

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  const decide = async (it, action) => {
    const label = action === 'approve' ? '수락' : '거절';
    if (!confirm(`${it.name} (${it.nnumber}) 님의 가입 요청을 ${label}할까요?`)) return;
    setBusyId(it.id);
    setErr('');
    try {
      await api(`/inbox/${it.id}/${action}`, { method: 'POST' });
      await load();
    } catch (e) {
      setErr(e.message);
      await load().catch(() => {});
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>수신함</h1>
          <p className="muted">회원가입 요청을 수락하거나 거절할 수 있습니다. 수락된 사용자만 로그인할 수 있습니다.</p>
        </div>
      </div>

      {err && <div className="error-text" style={{ marginBottom: 12 }}>{err}</div>}

      <h3>대기 중인 요청 ({data.pending.length})</h3>
      {data.pending.length === 0 ? (
        <div className="inbox-empty">새로운 가입 요청이 없습니다.</div>
      ) : (
        <div className="inbox-list">
          {data.pending.map((it) => (
            <div key={it.id} className="inbox-item">
              <div className="inbox-main">
                <b>{it.name}</b> <span className="muted">{it.nnumber}</span>
                <small>가입 요청 · {fmt(it.requestedAt)}</small>
              </div>
              <div className="inbox-actions">
                <button className="btn primary" disabled={busyId === it.id} onClick={() => decide(it, 'approve')}>수락</button>
                <button className="btn danger" disabled={busyId === it.id} onClick={() => decide(it, 'reject')}>거절</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3>처리 내역</h3>
      {data.done.length === 0 ? (
        <div className="inbox-empty">처리한 요청이 없습니다.</div>
      ) : (
        <div className="inbox-list">
          {data.done.map((it) => (
            <div key={it.id} className="inbox-item">
              <div className="inbox-main">
                <b>{it.name}</b> <span className="muted">{it.nnumber}</span>
                <small>{fmt(it.decidedAt)}</small>
              </div>
              <span className={`pill ${it.status}`}>{it.status === 'approved' ? '수락됨' : '거절됨'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
