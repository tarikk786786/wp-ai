import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import UserChat from './components/UserChat';
import AdminLogin from './components/AdminLogin';
import AdminLayout from './components/AdminLayout';

function AdminRoute() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin-token'));
  const navigate = useNavigate();

  if (!token) {
    return <AdminLogin onLogin={(t) => setToken(t)} onBack={() => navigate('/')} />;
  }

  return <AdminLayout token={token} onLogout={() => setToken(null)} />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserChat />} />
        <Route path="/admin/*" element={<AdminRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
