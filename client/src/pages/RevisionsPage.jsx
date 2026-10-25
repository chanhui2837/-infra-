import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAuth, DELETER_NNUMBER } from '../auth.jsx';
import Modal from '../components/Modal.jsx';
import PhotoField from '../components/PhotoField.jsx';

const REGIONS = ['춘천', '양구', '홍천', '인제', '철원', '화천'];

const EMPTY = {
  seq: '',
  region: '춘천',
  facilityCode: '',
  siteName: '',
  date: '',
  manager: '',
  done: '',
  worker: '',
  actionDate: '',
  note: '',
  photos: [],
};

function Text({ label, value, onChange, type = 'text' }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function RevisionsPage() {
  const { user } = useAuth();
  const canDelete = user?.nnumber === DELETER_NNUMBER;
  const [items, setItems] = useState([]);
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setErr('');
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    const { items } = await api(`/revisions?${params.toString()}`);
    setItems(items);
  };

  useEffect(() => {
    load().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, status, q]);

  const nextSeq = useMemo(() => items.reduce((m, it) => Math.max(m, it.seq || 0), 0) + 1, [items]);
  const set = (patch) => setEditing((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      const { _id, createdAt, updatedAt, __v, ...payload } = editing;
      if (editing._id) await api(`/revisions/${editing._id}`, { method: 'PATCH', body: payload });
      else await api('/revisions', { method: 'POST', body: payload });
      setEditing(null);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (it) => {
    if (!confirm(`순번 ${it.seq} (${it.siteName || it.facilityCode}) 항목을 삭제할까요?`)) return;
    await api(`/revisions/${it._id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>DORS415 정류기 리비전 진행 내역</h1>
          <p className="muted">DORS415 정류기 Revision 진행내역 (엑셀 3번 시트) · 모든 가입자가 추가/수정할 수 있습니다.</p>
        </div>
        <button className="btn primary" onClick={() => setEditing({ ...EMPTY, seq: nextSeq })}>+ 항목 추가 등록</button>
      </div>

      <div className="toolbar">
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">전체 지역</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">전체 상태</option>
          <option value="완료">완료</option>
          <option value="미완료">미완료</option>
        </select>
        <input className="search" placeholder="국소명 / 통합시설코드 / 대응자 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="count">{items.length}건</span>
      </div>

      {err && <div className="error-text">{err}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>순번</th>
              <th>지역</th>
              <th>통합시설코드</th>
              <th className="wide">국소명</th>
              <th>날짜</th>
              <th>대응자</th>
              <th>완료유무</th>
              <th>작업자</th>
              <th>조치 날짜</th>
              <th>사진</th>
              <th>수정</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it.seq}</td>
                <td>{it.region}</td>
                <td className="mono">{it.facilityCode}</td>
                <td className="wide">{it.siteName}</td>
                <td>{it.date}</td>
                <td>{it.manager}</td>
                <td className={/완료/.test(it.done) ? 'ok' : 'danger'}>{it.done || '미완료'}</td>
                <td>{it.worker}</td>
                <td>{it.actionDate}</td>
                <td><span className="pill">{it.photos?.length || 0}</span></td>
                <td className="row-actions">
                  <button className="btn small" onClick={() => setEditing({ ...it })}>수정</button>
                  {canDelete && (
                    <button className="btn small danger" onClick={() => remove(it)}>삭제</button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={11} className="empty">데이터가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing._id ? `리비전 수정 (순번 ${editing.seq})` : '리비전 항목 추가'} onClose={() => setEditing(null)} width={820}>
          <div className="form-grid">
            <Text label="순번" type="number" value={editing.seq} onChange={(v) => set({ seq: v })} />
            <label className="field">
              <span className="field-label">지역</span>
              <select value={editing.region} onChange={(e) => set({ region: e.target.value })}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <Text label="통합시설코드" value={editing.facilityCode} onChange={(v) => set({ facilityCode: v })} />
            <Text label="날짜" type="date" value={editing.date} onChange={(v) => set({ date: v })} />
            <Text label="대응자" value={editing.manager} onChange={(v) => set({ manager: v })} />
            <Text label="완료유무" value={editing.done} onChange={(v) => set({ done: v })} />
            <Text label="작업자" value={editing.worker} onChange={(v) => set({ worker: v })} />
            <Text label="조치 날짜" type="date" value={editing.actionDate} onChange={(v) => set({ actionDate: v })} />
            <label className="field span-2">
              <span className="field-label">국소명</span>
              <input value={editing.siteName} onChange={(e) => set({ siteName: e.target.value })} />
            </label>
          </div>

          <label className="field">
            <span className="field-label">비고</span>
            <textarea rows="2" value={editing.note} onChange={(e) => set({ note: e.target.value })} />
          </label>

          <PhotoField label="작업 사진" value={editing.photos || []} onChange={(v) => set({ photos: v })} />

          <div className="modal-actions">
            <button className="btn" onClick={() => setEditing(null)}>취소</button>
            <button className="btn primary" onClick={save} disabled={busy}>{busy ? '저장 중…' : '저장'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
