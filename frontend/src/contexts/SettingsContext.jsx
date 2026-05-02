// src/contexts/SettingsContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SettingsContext = createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Buscar lista de settings e pegar o primeiro
      const response = await axios.get('http://localhost:8080/api/settings');
      const settingsList = response.data;

      if (Array.isArray(settingsList) && settingsList.length > 0) {
        setSettings(settingsList[0]);
      } else if (settingsList && settingsList.id) {
        setSettings(settingsList);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings({
        nome: 'default',
        permitirDesembolsoComDivida: false,
        pagamentosEmOrdem: false,
        ignorarValorPagoNoPrazo: false,
        pagarEmSequencia: false,
        alterarDataPagamento: false,
        conta1: '', conta2: '', conta3: '',
        rodaPePlanoDePagamento: '', nbPlanoDePagamento: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
      try {
        // Pegar o ID - se não tiver settings.id, buscar primeiro
        let id = settings?.id;

        if (!id) {
          // Buscar o ID correto
          const resp = await axios.get('/api/settings');
          const list = resp.data;
          const first = Array.isArray(list) ? list[0] : list;
          id = first?.id;
          if (!id) throw new Error('ID dos settings não encontrado');
        }

        console.log('🔧 Salvando settings com ID:', id);
        const response = await axios.put(`/api/settings/${id}`, newSettings);
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