// src/hooks/useCredito.js
import { useState, useEffect } from 'react';
import creditoService from '../services/creditoService';

export const useDefinicoesCredito = () => {
  const [definicoes, setDefinicoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await creditoService.listarDefinicoes();
      // Garantir que é um array
      setDefinicoes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar definições:', err);
      setDefinicoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  return { definicoes, loading, error, recarregar: carregar };
};