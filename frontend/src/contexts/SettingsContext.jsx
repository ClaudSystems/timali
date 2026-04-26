import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Criar o contexto
const SettingsContext = createContext(null);

// Hook personalizado para usar o contexto
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Provider component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('/api/settings/1');
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Definir valores padrão em caso de erro
      setSettings({
        nome: 'default',
        permitirDesembolsoComDivida: false,
        pagamentosEmOrdem: false,
        ignorarValorPagoNoPrazo: false,
        pagarEmSequencia: false,
        alterarDataPagamento: false,
        conta1: '',
        conta2: '',
        conta3: '',
        rodaPePlanoDePagamento: '',
        nbPlanoDePagamento: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await axios.put('/api/settings/1', newSettings);
      setSettings(response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const value = {
    settings,
    loading,
    updateSettings,
    refreshSettings: loadSettings,
    // Helpers para acessar configurações específicas
    isPermitirDesembolsoComDivida: settings?.permitirDesembolsoComDivida || false,
    isPagamentosEmOrdem: settings?.pagamentosEmOrdem || false,
    isIgnorarValorPagoNoPrazo: settings?.ignorarValorPagoNoPrazo || false,
    isPagarEmSequencia: settings?.pagarEmSequencia || false,
    isAlterarDataPagamento: settings?.alterarDataPagamento || false,
    conta1: settings?.conta1 || '',
    conta2: settings?.conta2 || '',
    conta3: settings?.conta3 || '',
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;