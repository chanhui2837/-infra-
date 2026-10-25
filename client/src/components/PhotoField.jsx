import { useRef, useState } from 'react';
import { api, photoUrl } from '../api.js';

/**
 * 사진 업로드/삭제 필드.
 * value: 사진 id 배열, onChange(ids) 로 상위 상태 갱신.
 */
export default function PhotoField({ label, value = [], onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    setErr('');
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const { photos } = await api('/photos', { method: 'POST', body: fd, isForm: true });
      onChange([...value, ...photos.map((p) => p.id)]);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (id) => onChange(value.filter((v) => v !== id));

  return (
    <div className="photo-field">
      <div className="photo-field-head">
        <span className="field-label">{label}</span>
        <button type="button" className="btn small" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? '업로드 중…' : '사진 추가'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFiles}
        />
      </div>
      {err && <div className="error-text">{err}</div>}
      <div className="photo-grid">
        {value.length === 0 && <div className="photo-empty">등록된 사진이 없습니다.</div>}
        {value.map((id) => (
          <div className="photo-thumb" key={id}>
            <a href={photoUrl(id)} target="_blank" rel="noreferrer">
              <img src={photoUrl(id)} alt="첨부 사진" loading="lazy" />
            </a>
            <button type="button" className="photo-del" onClick={() => remove(id)} aria-label="삭제">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
