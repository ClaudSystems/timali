// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import EntidadeCRUD from './components/EntidadeCRUD';
import TaxasPage from './pages/TaxasPage';
import FeriadosPage from './pages/FeriadosPage';
import DefinicoesCreditoPage from './pages/DefinicoesCreditoPage';
// NOVOS IMPORTS - MÓDULO DE CRÉDITO
import CreditoIndex from './pages/credito/CreditoIndex';
import CreditoCreate from './pages/credito/CreditoCreate';
import CreditoShow from './pages/credito/CreditoShow';
import ParcelaList from './components/credito/ParcelaList';
import MainLayout from './layouts/MainLayout';

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

          <li style={{ marginBottom: '20px' }}>
            <Link to="/feriados" style={{ fontSize: '18px', fontWeight: 'bold', textDecoration: 'none', color: '#2196F3' }}>
              📅 Gerir Feriados
            </Link>
            <p style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
              Configurar feriados nacionais, provinciais e municipais
            </p>
          </li>

          <li style={{ marginBottom: '20px' }}>
            <Link to="/definicoes-credito" style={{ fontSize: '18px', fontWeight: 'bold', textDecoration: 'none', color: '#2196F3' }}>
              📦 Definições de Crédito
            </Link>
            <p style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
              Configurar pacotes/templates de crédito (prestações, juros, mora)
            </p>
          </li>

          {/* NOVO: Item de menu para Créditos */}
          <li style={{ marginBottom: '20px' }}>
            <Link to="/creditos" style={{ fontSize: '18px', fontWeight: 'bold', textDecoration: 'none', color: '#4CAF50' }}>
              💵 Gerir Créditos
            </Link>
            <p style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
              Conceder créditos, visualizar parcelas e gerir pagamentos
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
          {/* Rota pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Dashboard */}

          <Route path="/" element={

            <PrivateRoute>
            <MainLayout>
              <Dashboard />
              </MainLayout>
            </PrivateRoute>
          } />

          {/* Entidades */}
          <Route path="/entidades" element={

            <PrivateRoute>
            <MainLayout>
              <EntidadeCRUD />
              </MainLayout>
            </PrivateRoute>
          } />

          {/* Taxas */}
          <Route path="/taxas" element={
            <PrivateRoute>
            <MainLayout>
              <TaxasPage />
              </MainLayout>
            </PrivateRoute>
          } />

          {/* Feriados */}
          <Route path="/feriados" element={
            <PrivateRoute>
            <MainLayout>
            <FeriadosPage />
            </MainLayout>


            </PrivateRoute>
          } />

          {/* Definições de Crédito */}
          <Route path="/definicoes-credito" element={
            <PrivateRoute>
             <MainLayout>
              <DefinicoesCreditoPage />
              </MainLayout>
            </PrivateRoute>
          } />

          {/* ========== NOVAS ROTAS - MÓDULO DE CRÉDITO ========== */}

          {/* Lista de Créditos */}
          <Route path="/creditos" element={
            <PrivateRoute>
            <MainLayout>
              <CreditoIndex />
              </MainLayout>
            </PrivateRoute>
          } />

          {/* Novo Crédito */}
          <Route path="/creditos/novo" element={
            <PrivateRoute>
             <MainLayout>
              <CreditoCreate />
              </MainLayout>
            </PrivateRoute>
          } />

          {/* Detalhes do Crédito */}
          <Route path="/creditos/:id" element={
            <PrivateRoute>
            <MainLayout>
              <CreditoShow />
              </MainLayout>
            </PrivateRoute>
          } />

          {/* Parcelas do Crédito */}
          <Route path="/creditos/:id/parcelas" element={
            <PrivateRoute>
            <MainLayout>
              <ParcelaList />
              </MainLayout>
            </PrivateRoute>
          } />

          {/* Rota fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;