import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { TopBar } from './components/Logo.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TripsPage from './pages/TripsPage.jsx';
import RevisionsPage from './pages/RevisionsPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';

function Center({ children }) {
  return <div className="center">{children}</div>;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Center>불러오는 중…</Center>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <TopBar />
      <main className="page">{children}</main>
    </>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={loading ? <Center>불러오는 중…</Center> : user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/trips" element={<Protected><TripsPage /></Protected>} />
      <Route path="/revisions" element={<Protected><RevisionsPage /></Protected>} />
      <Route path="/gallery" element={<Protected><GalleryPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
