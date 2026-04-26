// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ptPT from 'antd/locale/pt_PT';
import LoginPage from './components/LoginPage';
import EntidadeCRUD from './components/EntidadeCRUD';
import TaxasPage from './pages/TaxasPage';
import FeriadosPage from './pages/FeriadosPage';
import DefinicoesCreditoPage from './pages/DefinicoesCreditoPage';
import CreditoIndex from './pages/credito/CreditoIndex';
import CreditoCreate from './pages/credito/CreditoCreate';
import CreditoShow from './pages/credito/CreditoShow';
import ParcelaList from './components/credito/ParcelaList';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import { SettingsProvider } from './contexts/SettingsContext';
import MainLayout from './components/layouts/MainLayout';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('timali_token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ConfigProvider locale={ptPT}>
      <SettingsProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
              <PrivateRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </PrivateRoute>
            } />

            <Route path="/entidades" element={
              <PrivateRoute>
                <MainLayout>
                  <EntidadeCRUD />
                </MainLayout>
              </PrivateRoute>
            } />

            <Route path="/taxas" element={
              <PrivateRoute>
                <MainLayout>
                  <TaxasPage />
                </MainLayout>
              </PrivateRoute>
            } />

            <Route path="/feriados" element={
              <PrivateRoute>
                <MainLayout>
                  <FeriadosPage />
                </MainLayout>
              </PrivateRoute>
            } />

            <Route path="/definicoesCredito" element={
              <PrivateRoute>
                <MainLayout>
                  <DefinicoesCreditoPage />
                </MainLayout>
              </PrivateRoute>
            } />

            <Route path="/creditos" element={
              <PrivateRoute>
                <MainLayout>
                  <CreditoIndex />
                </MainLayout>
              </PrivateRoute>
            } />

            <Route path="/creditos/novo" element={
              <PrivateRoute>
                <MainLayout>
                  <CreditoCreate />
                </MainLayout>
              </PrivateRoute>
            } />

            <Route path="/creditos/:id" element={
              <PrivateRoute>
                <MainLayout>
                  <CreditoShow />
                </MainLayout>
              </PrivateRoute>
            } />

            <Route path="/creditos/:id/parcelas" element={
              <PrivateRoute>
                <MainLayout>
                  <ParcelaList />
                </MainLayout>
              </PrivateRoute>
            } />

            <Route path="/settings" element={
              <PrivateRoute>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </PrivateRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </SettingsProvider>
    </ConfigProvider>
  );
}

export default App;