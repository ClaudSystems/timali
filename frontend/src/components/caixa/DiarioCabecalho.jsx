// src/components/caixa/DiarioCabecalho.jsx
import React, { useState } from 'react';
import { Card, Row, Col, Button, Typography, Space, DatePicker, Alert } from 'antd';
import { SearchOutlined, CalendarOutlined, ReloadOutlined, WalletOutlined,
    HistoryOutlined, PrinterOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { gerarPdfDiario } from '../../services/diarioPdfService';
import ModalFecharDiario from './ModalFecharDiario';
import moment from 'moment';

const { Text } = Typography;

const DiarioCabecalho = ({ dataSelecionada, setDataSelecionada, diario, loading, salvando,
    onBuscar, onGerar, onHoje, onFechar, onReabrir, onHistorico, mensagemErro, setMensagemErro }) => {

    const [modalFechar, setModalFechar] = useState(false);

    const imprimir = () => {
        if (diario) gerarPdfDiario(diario);
    };

    return (
        <>
            <Card size="small" style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} sm={12} md={4}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Data</Text>
                        <DatePicker value={dataSelecionada} onChange={d => { setDataSelecionada(d); }}
                            format="DD/MM/YYYY" style={{ width: '100%' }} allowClear={false}
                            disabledDate={c => c && c > moment().endOf('day')} />
                    </Col>
                    <Col xs={24} sm={12} md={20}>
                        <Space wrap size="small" style={{ marginTop: 22 }}>
                            <Button type="primary" icon={<SearchOutlined />} onClick={onBuscar} loading={loading}>Buscar</Button>
                            <Button icon={<CalendarOutlined />} onClick={onGerar} loading={loading}>Gerar</Button>
                            <Button icon={<ReloadOutlined />} onClick={onHoje}>Hoje</Button>
                            {diario && !diario.fechado && (
                                <Button icon={<LockOutlined />} onClick={() => setModalFechar(true)} loading={salvando}
                                    style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', color: '#fff' }}>Fechar</Button>
                            )}
                            {diario && diario.fechado && (
                                <Button icon={<UnlockOutlined />} onClick={onReabrir} loading={salvando}
                                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>Reabrir</Button>
                            )}
                            {diario && (
                                <Button icon={<PrinterOutlined />} onClick={imprimir}
                                    style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: '#fff' }}>PDF</Button>
                            )}
                            <Button icon={<HistoryOutlined />} onClick={onHistorico}>Histórico</Button>
                        </Space>
                    </Col>
                </Row>
                {mensagemErro && <Alert message={mensagemErro} type="info" showIcon closable onClose={() => setMensagemErro('')} style={{ marginTop: 12 }} />}
            </Card>

            <ModalFecharDiario
                open={modalFechar}
                diario={diario}
                salvando={salvando}
                onCancel={() => setModalFechar(false)}
                onConfirm={onFechar}
            />
        </>
    );
};

export default DiarioCabecalho;