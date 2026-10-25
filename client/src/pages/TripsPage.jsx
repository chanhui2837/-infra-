import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import Modal from '../components/Modal.jsx';
import PhotoField from '../components/PhotoField.jsx';

const REGIONS = ['춘천', '양구', '홍천', '인제', '철원', '화천'];

const EMPTY = {
  seq: '',
  region: '춘천',
  facilityCode: '',
  siteName: '',
  occurredDate: '',
  manager: '',
  breakerType: '',
  breakerLocation: '',
  occurCount: '',
  breakerStatus: '',
  insulationResistance: '',
  inspectProgress: '',
  defectCause: '',
  actionResult: '',
  keyMission: '',
  actionDate: '',
  actionBy: '',
  actionNote: '',
  etcNote: '',
  spd: '',
  acta: '',
  visits: [],
  beforePhotos: [],
  afterPhotos: [],
};

function Text({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input type={type} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function TripsPage() {
  const [items, setItems] = useState([]);
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // null | object
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setErr('');
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    const { items } = await api(`/trips?${params.toString()}`);
    setItems(items);
  };

  useEffect(() => {
    load().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, status, q]);

  const nextSeq = useMemo(() => items.reduce((m, it) => Math.max(m, it.seq || 0), 0) + 1, [items]);

  const openNew = () => setEditing({ ...EMPTY, seq: nextSeq });
  const openEdit = (it) => setEditing({ ...it });

  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      const { _id, createdAt, updatedAt, __v, ...payload } = editing;
      if (editing._id) await api(`/trips/${editing._id}`, { method: 'PATCH', body: payload });
      else await api('/trips', { method: 'POST', body: payload });
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
    await api(`/trips/${it._id}`, { method: 'DELETE' });
    await load();
  };

  const set = (patch) => setEditing((prev) => ({ ...prev, ...patch }));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>차단기 트립 진행 내역</h1>
          <p className="muted">차단기 트립 점검·조치 진행내역 (엑셀 2번 시트) · 모든 가입자가 추가/수정할 수 있습니다.</p>
        </div>
        <button className="btn primary" onClick={openNew}>+ 항목 추가 등록</button>
      </div>

      <div className="toolbar">
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">전체 지역</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">전체 상태</option>
          <option value="완료">완료</option>
          <option value="진행중">진행중</option>
        </select>
        <input
          className="search"
          placeholder="국소명 / 통합시설코드 / 담당자 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
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
              <th>발생일자</th>
              <th>담당자</th>
              <th>차단기 타입</th>
              <th>발생건수</th>
              <th>차단기 상태</th>
              <th>절연저항</th>
              <th>점검진행</th>
              <th>불량원인</th>
              <th>조치결과</th>
              <th>조치날짜</th>
              <th>조치자</th>
              <th>조치내역</th>
              <th>기타 내역</th>
              <th>교체 사진</th>
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
                <td>{it.occurredDate}</td>
                <td>{it.manager}</td>
                <td>{it.breakerType}</td>
                <td>{it.occurCount}</td>
                <td>{it.breakerStatus}</td>
                <td className={/불량/.test(it.insulationResistance) ? 'danger' : ''}>{it.insulationResistance}</td>
                <td>{it.inspectProgress}</td>
                <td>{it.defectCause}</td>
                <td className={/완료/.test(it.actionResult) ? 'ok' : 'danger'}>{it.actionResult}</td>
                <td>{it.actionDate}</td>
                <td>{it.actionBy}</td>
                <td className="note">{it.actionNote}</td>
                <td className="note">{it.etcNote}</td>
                <td className="photo-cell">
                  <span className="pill">전 {it.beforePhotos?.length || 0}</span>
                  <span className="pill">후 {it.afterPhotos?.length || 0}</span>
                </td>
                <td className="row-actions">
                  <button className="btn small" onClick={() => openEdit(it)}>수정</button>
                  <button className="btn small danger" onClick={() => remove(it)}>삭제</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={19} className="empty">데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing._id ? `차단기 트립 수정 (순번 ${editing.seq})` : '차단기 트립 항목 추가'} onClose={() => setEditing(null)} width={1000}>
          <div className="form-grid">
            <Text label="순번" type="number" value={editing.seq} onChange={(v) => set({ seq: v })} />
            <label className="field">
              <span className="field-label">지역</span>
              <select value={editing.region} onChange={(e) => set({ region: e.target.value })}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <Text label="통합시설코드" value={editing.facilityCode} onChange={(v) => set({ facilityCode: v })} />
            <Text label="담당자" value={editing.manager} onChange={(v) => set({ manager: v })} />
            <Text label="발생일자" type="date" value={editing.occurredDate} onChange={(v) => set({ occurredDate: v })} />
            <Text label="차단기 타입" value={editing.breakerType} onChange={(v) => set({ breakerType: v })} />
            <Text label="트립 차단기 위치" value={editing.breakerLocation} onChange={(v) => set({ breakerLocation: v })} />
            <Text label="발생건수" value={editing.occurCount} onChange={(v) => set({ occurCount: v })} />
            <Text label="차단기 상태" value={editing.breakerStatus} onChange={(v) => set({ breakerStatus: v })} />
            <Text label="절연저항" value={editing.insulationResistance} onChange={(v) => set({ insulationResistance: v })} />
            <Text label="점검진행" value={editing.inspectProgress} onChange={(v) => set({ inspectProgress: v })} />
            <Text label="불량원인" value={editing.defectCause} onChange={(v) => set({ defectCause: v })} />
            <Text label="조치결과" value={editing.actionResult} onChange={(v) => set({ actionResult: v })} />
            <Text label="KEY MISSION 대상" value={editing.keyMission} onChange={(v) => set({ keyMission: v })} />
            <Text label="조치 날짜" type="date" value={editing.actionDate} onChange={(v) => set({ actionDate: v })} />
            <Text label="조치자" value={editing.actionBy} onChange={(v) => set({ actionBy: v })} />
            <Text label="SPD 설치 유무" value={editing.spd} onChange={(v) => set({ spd: v })} />
            <Text label="ACTA 등록 여부" value={editing.acta} onChange={(v) => set({ acta: v })} />
          </div>

          <div className="form-grid">
            <label className="field span-2">
              <span className="field-label">국소명</span>
              <input value={editing.siteName} onChange={(e) => set({ siteName: e.target.value })} />
            </label>
            <label className="field span-2">
              <span className="field-label">조치내역</span>
              <textarea rows="2" value={editing.actionNote} onChange={(e) => set({ actionNote: e.target.value })} />
            </label>
            <label className="field span-2">
              <span className="field-label">기타 내역</span>
              <textarea rows="2" value={editing.etcNote} onChange={(e) => set({ etcNote: e.target.value })} />
            </label>
          </div>

          <div className="photo-split">
            <PhotoField label="교체 전 사진" value={editing.beforePhotos || []} onChange={(v) => set({ beforePhotos: v })} />
            <PhotoField label="교체 후 사진" value={editing.afterPhotos || []} onChange={(v) => set({ afterPhotos: v })} />
          </div>

          <div className="visits">
            <div className="visits-head">
              <span className="field-label">방문/대응 이력</span>
              <button
                type="button"
                className="btn small"
                onClick={() => set({ visits: [...(editing.visits || []), { responder: '', date: '', note: '' }] })}
              >
                + 방문 이력 추가
              </button>
            </div>
            {(editing.visits || []).map((v, i) => (
              <div className="visit-row" key={i}>
                <input
                  placeholder="대응자"
                  value={v.responder || ''}
                  onChange={(e) => {
                    const next = [...editing.visits];
                    next[i] = { ...next[i], responder: e.target.value };
                    set({ visits: next });
                  }}
                />
                <input
                  type="date"
                  value={v.date || ''}
                  onChange={(e) => {
                    const next = [...editing.visits];
                    next[i] = { ...next[i], date: e.target.value };
                    set({ visits: next });
                  }}
                />
                <input
                  placeholder="점검/대응 내역"
                  value={v.note || ''}
                  onChange={(e) => {
                    const next = [...editing.visits];
                    next[i] = { ...next[i], note: e.target.value };
                    set({ visits: next });
                  }}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => set({ visits: editing.visits.filter((_, j) => j !== i) })}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button className="btn" onClick={() => setEditing(null)}>취소</button>
            <button className="btn primary" onClick={save} disabled={busy}>{busy ? '저장 중…' : '저장'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
