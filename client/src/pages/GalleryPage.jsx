import { useEffect, useRef, useState } from 'react';
import { api, photoUrl } from '../api.js';

export default function GalleryPage() {
  const [photos, setPhotos] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const load = async () => {
    try {
      const { photos } = await api('/photos/meta/list');
      setPhotos(photos);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    setErr('');
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      await api('/photos', { method: 'POST', body: fd, isForm: true });
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (id) => {
    if (!confirm('이 사진을 삭제할까요? 모든 사용자에게서 사라집니다.')) return;
    await api(`/photos/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>공유 갤러리</h1>
          <p className="muted">업로드한 사진은 모든 가입자에게 실시간으로 공유됩니다. (엑셀에 포함된 사진 포함)</p>
        </div>
        <div>
          <button className="btn primary" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? '업로드 중…' : '+ 사진 업로드'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={upload} />
        </div>
      </div>

      {err && <div className="error-text">{err}</div>}

      <div className="gallery-grid">
        {photos.map((p) => (
          <figure className="gallery-item" key={p.id}>
            <a href={photoUrl(p.id)} target="_blank" rel="noreferrer">
              <img src={photoUrl(p.id)} alt={p.filename} loading="lazy" />
            </a>
            <figcaption>
              <span>{p.filename}</span>
              <small>{p.uploadedByName || '알 수 없음'} · {(p.size / 1024 / 1024).toFixed(2)}MB</small>
            </figcaption>
            <button className="photo-del" onClick={() => remove(p.id)} aria-label="삭제">✕</button>
          </figure>
        ))}
        {photos.length === 0 && <div className="empty">등록된 사진이 없습니다.</div>}
      </div>
    </div>
  );
}
