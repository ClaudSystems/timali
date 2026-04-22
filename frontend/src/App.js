// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import EntidadeCRUD from './components/EntidadeCRUD';
import TaxasPage from './pages/TaxasPage';
import FeriadosPage from './pages/FeriadosPage'; // ← NOVO: Import da página de Feriados

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
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '20px' }}>
            <Link to="/entidades" style={{ fontSize: '18px', fontWeight: 'bold', textDecoration: 'none', color: '#2196F3' }}>
              📋 Gerir Entidades
            </Link>
            <p style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
              Gerir clientes, fornecedores, funcionários e assinantes
            </p>
          </li>

          <li style={{ marginBottom: '20px' }}>
            <Link to="/taxas" style={{ fontSize: '18px', fontWeight: 'bold', textDecoration: 'none', color: '#2196F3' }}>
              💰 Gerir Taxas
            </Link>
            <p style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
              Configurar taxas percentuais, valores fixos e faixas escalonadas
            </p>
          </li>

          {/* NOVO: Item de menu para Feriados */}
          <li style={{ marginBottom: '20px' }}>
            <Link to="/feriados" style={{ fontSize: '18px', fontWeight: 'bold', textDecoration: 'none', color: '#2196F3' }}>
              📅 Gerir Feriados
            </Link>
            <p style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
              Configurar feriados nacionais, provinciais e municipais para cálculo de datas de pagamento
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

          <Route path="/taxas" element={
            <PrivateRoute>
              <TaxasPage />
            </PrivateRoute>
          } />

          {/* NOVO: Rota para o CRUD de Feriados */}
          <Route path="/feriados" element={
            <PrivateRoute>
              <FeriadosPage />
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;