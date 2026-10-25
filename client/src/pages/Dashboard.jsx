import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const pct = (v) => `${(v * 100).toFixed(1)}%`;

function WorkCard({ title, accent, data, onOpen, description }) {
  if (!data) return null;
  return (
    <section className="work-card" style={{ '--accent': accent }}>
      <div className="work-card-head">
        <div>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </div>
        <button className="btn" onClick={onOpen}>진행내역 열기 →</button>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-label">총 대상</span>
          <b className="stat-value">{data.total}</b>
        </div>
        <div className="stat">
          <span className="stat-label">완료</span>
          <b className="stat-value">{data.done}</b>
        </div>
        <div className="stat">
          <span className="stat-label">미완료</span>
          <b className="stat-value danger">{data.pending}</b>
        </div>
        <div className="stat">
          <span className="stat-label">조치율</span>
          <b className="stat-value">{pct(data.rate)}</b>
        </div>
      </div>

      <div className="progress">
        <div className="progress-bar" style={{ width: pct(data.rate) }} />
      </div>

      <table className="mini-table">
        <thead>
          <tr>
            <th>지역</th>
            <th>대상</th>
            <th>완료</th>
            <th>미완료</th>
            <th>조치율</th>
          </tr>
        </thead>
        <tbody>
          {data.regions.map((r) => (
            <tr key={r.region} className={r.total === 0 ? 'dim' : ''}>
              <td>{r.region}</td>
              <td>{r.total}</td>
              <td>{r.done}</td>
              <td className={r.pending > 0 ? 'danger' : ''}>{r.pending}</td>
              <td>{r.total ? pct(r.rate) : '-'}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td>합계</td>
            <td>{data.total}</td>
            <td>{data.done}</td>
            <td>{data.pending}</td>
            <td>{pct(data.rate)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      const [s, u] = await Promise.all([api('/summary'), api('/auth/users')]);
      setSummary(s);
      setUsers(u.users);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (err) return <div className="error-text">{err}</div>;
  if (!summary) return <div className="center">불러오는 중…</div>;

  const updated = summary.updatedAt ? new Date(summary.updatedAt) : null;

  return (
    <div className="dashboard">
      <div className="page-head">
        <div>
          <h1>실적 총괄</h1>
          <p className="muted">
            엑셀 진행내역을 실시간으로 공유·동기화합니다.
            {updated && ` · 마지막 동기화 ${updated.toLocaleString('ko-KR')}`}
          </p>
        </div>
        <button className="btn" onClick={load}>새로고침</button>
      </div>

      <div className="work-grid">
        <WorkCard
          title="차단기 트립"
          accent="#EA002C"
          data={summary.trips}
          description="차단기 트립 점검·조치 진행 총괄 (엑셀 2번 시트)"
          onOpen={() => navigate('/trips')}
        />
        <WorkCard
          title="DORS415 정류기 Revision"
          accent="#F58220"
          data={summary.revisions}
          description="DORS415 정류기 리비전 작업 진행 총괄 (엑셀 3번 시트)"
          onOpen={() => navigate('/revisions')}
        />
      </div>

      <div className="dashboard-bottom">
        <section className="panel">
          <h3>특이사항</h3>
          {summary.notes?.length ? (
            <ul className="note-list">
              {summary.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">등록된 특이사항이 없습니다.</p>
          )}
        </section>

        <section className="panel">
          <h3>가입자 ({users.length}명)</h3>
          <div className="chips">
            {users.map((u) => (
              <span className="chip" key={u.id}>
                <b>{u.name}</b> <small>{u.nnumber}</small>
              </span>
            ))}
          </div>
          <p className="muted small">
            모든 가입자가 항목을 추가·수정할 수 있고, 사진을 올리면 모든 사용자에게 공유됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}
