// src/components/credito/CreditoDetails.jsx - VERSÃO DE DEPURAÇÃO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Spin, Alert, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import creditoService from '../../services/creditoService';

const CreditoDetails = ({ id }) => {
  const navigate = useNavigate();
  const [credito, setCredito] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) carregarCredito();
  }, [id]);

  const carregarCredito = async () => {
    setLoading(true);
    try {
      const data = await creditoService.buscar(id);
      console.log('=== DADOS BRUTOS RECEBIDOS ===');
      console.log('Data completo:', data);

      // Verificar CADA propriedade do objeto
      Object.keys(data).forEach(key => {
        const valor = data[key];
        const tipo = typeof valor;
        console.log(`${key}: ${tipo} =`, valor);
        if (tipo === 'object' && valor !== null) {
          console.log(`  -> OBJETO DETECTADO: ${key}`, JSON.stringify(valor));
        }
      });

      // Criar uma versão 100% string de tudo
      const safe = {};
      Object.keys(data).forEach(key => {
        const valor = data[key];
        if (valor === null || valor === undefined) {
          safe[key] = '-';
        } else if (typeof valor === 'object') {
          // Se for objeto, extrair name ou descricao ou converter para string
          if (valor.name) safe[key] = String(valor.name);
          else if (valor.descricao) safe[key] = String(valor.descricao);
          else if (valor.toString && valor.toString() !== '[object Object]') safe[key] = String(valor.toString());
          else safe[key] = `[Objeto: ${Object.keys(valor).join(',')}]`;
        } else {
          safe[key] = String(valor);
        }
      });

      console.log('=== DADOS CONVERTIDOS ===');
      console.log(safe);

      setCredito(safe);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spin size="large" style={{ margin: '50px' }} />;
  if (error) return <Alert message="Erro" description={error} type="error" />;
  if (!credito) return <Alert message="Crédito não encontrado" type="warning" />;

  // Renderizar APENAS campos de texto simples
  return (
    <div style={{ padding: 20 }}>
      <Card
        title={`Crédito #${credito.numero || 'N/A'}`}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/creditos')}>
            Voltar
          </Button>
        }
      >
        <h3>Campos do Crédito (todos convertidos para string):</h3>
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Campo</th>
              <th>Valor</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(credito).map(key => (
              <tr key={key}>
                <td><strong>{key}</strong></td>
                <td>{credito[key]}</td>
                <td>{typeof credito[key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default CreditoDetails;