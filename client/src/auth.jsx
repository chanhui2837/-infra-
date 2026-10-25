import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthContext = createContext(null);

// 진행내역 삭제 권한을 가진 사번 (서버 DELETER_NNUMBER 와 동일)
export const DELETER_NNUMBER = 'N1101924';
// 가입 승인(수신함) 담당 사번 (서버 APPROVER_NNUMBER 와 동일)
export const APPROVER_NNUMBER = 'N1101924';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api('/auth/me');
        setUser(user);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (nnumber) => {
    const { token, user } = await api('/auth/login', { method: 'POST', body: { nnumber } });
    setToken(token);
    setUser(user);
    return user;
  };

  const signup = async (name, nnumber) => {
    const data = await api('/auth/signup', { method: 'POST', body: { name, nnumber } });
    // 승인 대기: 토큰 없이 안내 메시지만 돌려준다 (승인 담당자 본인은 바로 로그인)
    if (data.pending) return { pending: true, message: data.message };
    setToken(data.token);
    setUser(data.user);
    return { pending: false, user: data.user };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
