const TOKEN_KEY = 'infra_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/**
 * 공통 API 호출. 실패 시 서버 메시지를 담은 Error 를 던진다.
 */
export async function api(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (isForm) {
    payload = body; // FormData (브라우저가 Content-Type 자동 설정)
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) throw new Error(data?.error || `요청 실패 (${res.status})`);
  return data;
}

export const photoUrl = (id) => `/api/photos/${id}`;

/**
 * 파일 다운로드(엑셀 등). 서버가 보낸 Content-Disposition 파일명을 사용해 저장한다.
 */
export async function downloadFile(path) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { headers });
  if (!res.ok) {
    let message = `다운로드 실패 (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* JSON 이 아니면 기본 메시지 유지 */
    }
    throw new Error(message);
  }

  const dispo = res.headers.get('Content-Disposition') || '';
  const utf8 = dispo.match(/filename\*=UTF-8''([^;]+)/i);
  const plain = dispo.match(/filename="?([^";]+)"?/i);
  const filename = utf8 ? decodeURIComponent(utf8[1]) : plain ? plain[1] : 'Infra_진행내역.xlsx';

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
