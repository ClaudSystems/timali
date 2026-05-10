// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import ptPT from 'antd/locale/pt_PT';
import UsuarioList from './components/usuario/UsuarioList';
import UsuarioForm from './components/usuario/UsuarioForm';
import RoleGroupList from './components/usuario/RoleGroupList';



// Contextos
import { SettingsProvider, useSettings } from './contexts/SettingsContext';

// Layout
import MainLayout from './components/layouts/MainLayout';

// Páginas
import LoginPage from './components/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TaxasPage from './pages/TaxasPage';
import FeriadosPage from './pages/FeriadosPage';
import DefinicoesCreditoPage from './pages/DefinicoesCreditoPage';
import CreditoIndex from './pages/credito/CreditoIndex';
import CreditoCreate from './pages/credito/CreditoCreate';
import CreditoShow from './pages/credito/CreditoShow';
import ParcelaList from './components/credito/ParcelaList';
import SettingsPage from './pages/SettingsPage';
import Caixa from './components/caixa/Caixa';
import HistoricoRecibos from './components/caixa/HistoricoRecibos';
import EntidadeList from './components/entidade/EntidadeList';

// Componente de Rota Protegida
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('timali_token');

  if (!token) {
    console.log('🔒 Acesso negado! Redirecionando para login...');
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente separado para usar o hook useSettings
const AppContent = () => {
  const { darkMode } = useSettings();

  return (
    <ConfigProvider
      locale={ptPT}
      theme={{
        algorithm: darkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Router>
        <Routes>
          {/* Rota PÚBLICA - Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas PROTEGIDAS */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </PrivateRoute>
            }
          />
            <Route path="/usuarios" element={<PrivateRoute><MainLayout><UsuarioList /></MainLayout></PrivateRoute>} />
            <Route path="/usuarios/novo" element={<PrivateRoute><MainLayout><UsuarioForm /></MainLayout></PrivateRoute>} />
            <Route path="/usuarios/:id" element={<PrivateRoute><MainLayout><UsuarioForm /></MainLayout></PrivateRoute>} />
            <Route path="/gruposroles" element={<PrivateRoute><MainLayout><RoleGroupList /></MainLayout></PrivateRoute>} />

            T
          <Route
            path="/taxas"
            element={
              <PrivateRoute>
                <MainLayout>
                  <TaxasPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/feriados"
            element={
              <PrivateRoute>
                <MainLayout>
                  <FeriadosPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/definicoesCredito"
            element={
              <PrivateRoute>
                <MainLayout>
                  <DefinicoesCreditoPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/creditos"
            element={
              <PrivateRoute>
                <MainLayout>
                  <CreditoIndex />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/creditos/novo"
            element={
              <PrivateRoute>
                <MainLayout>
                  <CreditoCreate />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/creditos/:id"
            element={
              <PrivateRoute>
                <MainLayout>
                  <CreditoShow />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/creditos/:id/parcelas"
            element={
              <PrivateRoute>
                <MainLayout>
                  <ParcelaList />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/caixa"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Caixa />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/recibos"
            element={
              <PrivateRoute>
                <MainLayout>
                  <HistoricoRecibos />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/entidades"
            element={
              <PrivateRoute>
                <MainLayout>
                  <EntidadeList />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Redirecionar qualquer rota não encontrada */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;