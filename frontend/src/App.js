import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import EntidadesList from './components/EntidadesList';
import EntidadeForm from './components/EntidadeForm';
import LoginPage from './components/LoginPage';

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
        <ul>
          <li><Link to="/entidades">Gerir Entidades</Link></li>
        </ul>
      </nav>
      <button onClick={handleLogout} style={{ marginTop: '20px', color: 'red' }}>Sair (Logout)</button>
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
              <EntidadesList />
            </PrivateRoute>
          } />

          <Route path="/entidades/novo" element={
            <PrivateRoute>
              <EntidadeForm />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
