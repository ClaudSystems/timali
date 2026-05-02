// src/components/caixa/Caixa.jsx
import React, { useState } from 'react';
import { Modal, Tabs, Typography } from 'antd';
import { WalletOutlined, HistoryOutlined, CalendarOutlined } from '@ant-design/icons';
import RegistarPagamento from './RegistarPagamento';
import HistoricoRecibos from './HistoricoRecibos';
import PrestacoesDoDia from './PrestacoesDoDia';
import ReciboPagamento from './ReciboPagamento';

const { Title } = Typography;

const Caixa = () => {
    const [tabAtiva, setTabAtiva] = useState('registar');

    // Estados compartilhados para o modal de recibo
    const [reciboModal, setReciboModal] = useState(false);
    const [reciboData, setReciboData] = useState(null);

    // Callback para abrir recibo (usado pelos componentes filhos)
    const handleAbrirRecibo = (recibo) => {
        setReciboData(recibo);
        setReciboModal(true);
    };

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}><WalletOutlined /> Caixa</Title>

            <Tabs
                activeKey={tabAtiva}
                onChange={setTabAtiva}
                destroyInactiveTabPane={false}
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
                        key: 'recibos',
                        label: <span><HistoryOutlined /> Recibos / Histórico</span>,
                        children: <HistoricoRecibos onAbrirRecibo={handleAbrirRecibo} />
                    }
                ]}
            />

            {/* Modal de Recibo (compartilhado) */}
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