// src/components/caixa/Caixa.jsx
import React, { useState } from 'react';
import { Modal, Tabs, Typography, Row, Col } from 'antd';
import { WalletOutlined, HistoryOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import DiarioStatusBar from './DiarioStatusBar';
import DiarioCaixa from './DiarioCaixa';
import SaidasCaixa from './SaidasCaixa';
import RegistarPagamento from './RegistarPagamento';
import HistoricoRecibos from './HistoricoRecibos';
import PrestacoesDoDia from './PrestacoesDoDia';
import ReciboPagamento from './ReciboPagamento';

const { Title } = Typography;

const Caixa = () => {
  const [tabAtiva, setTabAtiva] = useState('registar');
  const [reciboModal, setReciboModal] = useState(false);
  const [reciboData, setReciboData] = useState(null);

  const handleAbrirRecibo = (recibo) => {
    setReciboData(recibo);
    setReciboModal(true);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Barra superior única */}
      <div
        style={{
          background: '#fafafa',
          padding: '8px 16px',
          borderRadius: 6,
          border: '1px solid #f0f0f0',
          marginBottom: 24
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <WalletOutlined /> Caixa
            </Title>
          </Col>
          <Col>
            <DiarioStatusBar />
          </Col>
        </Row>
      </div>

      {/* Tabs principais */}
      <Tabs
        activeKey={tabAtiva}
        onChange={setTabAtiva}
        destroyOnHidden
        items={[
          {
            key: 'registar',
            label: <span><WalletOutlined /> Registar Pagamento</span>,
            children: <RegistarPagamento onAbrirRecibo={handleAbrirRecibo} />
          },
          {
            key: 'prestacoes',
            label: <span><CalendarOutlined /> Prestações do Dia</span>,
            children: <PrestacoesDoDia onAbrirRecibo={handleAbrirRecibo} />
          },
          {
            key: 'saidas',
            label: <span><DollarOutlined /> Saídas</span>,
            children: <SaidasCaixa />
          },
          {
            key: 'recibos',
            label: <span><HistoryOutlined /> Recibos / Histórico</span>,
            children: <HistoricoRecibos onAbrirRecibo={handleAbrirRecibo} />
          },
          {
            key: 'diario',
            label: <span><CalendarOutlined /> Diário</span>,
            children: <DiarioCaixa />
          }
        ]}
      />

      {/* Modal de Recibo */}
      <Modal
        title={null}
        open={reciboModal}
        onCancel={() => setReciboModal(false)}
        footer={null}
        width="100%"
        style={{ maxWidth: 950, top: 10 }}
        destroyOnClose
      >
        {reciboData && (
          <ReciboPagamento
            pagamento={reciboData}
            onClose={() => setReciboModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Caixa;
