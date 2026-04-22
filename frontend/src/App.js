import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import EntidadeCRUD from './components/EntidadeCRUD';

// Componente para proteger rotas
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('timali_token');
  return token ? children : <Navigate to="/login" />;
};

const Dashboard = () => {
  const user = localStorage.getItem('timali_user');

  const handleLogout = () => {
    localStorage.removeItem('timali_token');
    localStorage.removeItem('timali_user');
    window.location.href = '/login';
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard Timali</h1>
      <p>Olá, <strong>{user}</strong>! Bem-vindo ao sistema.</p>

      <nav>
        <h3>Menu Principal</h3>
        <ul>
          <li>
            <Link to="/entidades" style={{ fontSize: '18px', fontWeight: 'bold' }}>
              📋 Gerir Entidades
            </Link>
            <p style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
              Gerir clientes, fornecedores, funcionários e assinantes
            </p>
          </li>
        </ul>
      </nav>

      <button
        onClick={handleLogout}
        style={{
          marginTop: '30px',
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🚪 Sair (Logout)
      </button>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          <Route path="/entidades" element={
            <PrivateRoute>
              <EntidadeCRUD />
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;