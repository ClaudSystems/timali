// src/components/credito/ExtratoCreditoModal.jsx
import React, { useState, useEffect } from 'react';
import { Button, Space, Table, Descriptions, Card, Typography, Divider, Spin, message, Row, Col, Tag } from 'antd';
import { FilePdfOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import creditoService from '../../services/creditoService';
import extratoCreditoService from '../../services/extratoCreditoService';

const { Title, Text } = Typography;

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency', currency: 'MZN', minimumFractionDigits: 2
    }).format(valor || 0);
};

const safeString = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object' && value !== null) {
        if (value.name) return String(value.name);
        if (value.toString && value.toString() !== '[object Object]') return String(value);
        return '';
    }
    return String(value);
};

const ExtratoCreditoModal = ({ creditoId, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState(null);
    const [gerandoPDF, setGerandoPDF] = useState(false);

    useEffect(() => {
        if (creditoId) {
            carregarExtrato();
        }
    }, [creditoId]);

    const carregarExtrato = async () => {
        try {
            setLoading(true);
            const data = await creditoService.extrato(creditoId);
            console.log('Extrato carregado:', data);
            setDados(data);
        } catch (error) {
            message.error('Erro ao carregar extrato');
            console.error('Erro:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGerarPDF = async () => {
        if (!dados) return;
        try {
            setGerandoPDF(true);
            await extratoCreditoService.gerarExtrato(dados);
            message.success('PDF gerado com sucesso!');
        } catch (error) {
            message.error('Erro ao gerar PDF');
            console.error('Erro:', error);
        } finally {
            setGerandoPDF(false);
        }
    };

    const columns = [
        {
            title: 'Data',
            dataIndex: 'data',
            key: 'data',
            width: 80,
            render: (date) => date ? moment(date).format('DD/MM/YY') : '-'
        },
        {
            title: 'Descrição',
            dataIndex: 'descricao',
            key: 'descricao',
            ellipsis: true,
            render: (val) => safeString(val)
        },
        {
            title: 'Débito',
            dataIndex: 'debito',
            key: 'debito',
            width: 100,
            align: 'right',
            render: (valor) => Number(valor) > 0 ? (
                <span style={{ color: '#1b4332', fontWeight: 'bold' }}>{formatarMoeda(valor)}</span>
            ) : ''
        },
        {
            title: 'Crédito',
            dataIndex: 'credito',
            key: 'credito',
            width: 100,
            align: 'right',
            render: (valor) => Number(valor) > 0 ? (
                <span style={{ color: '#0077b6', fontWeight: 'bold' }}>{formatarMoeda(valor)}</span>
            ) : ''
        },
        {
            title: 'V. em Mora',
            dataIndex: 'valorEmMora',
            key: 'valorEmMora',
            width: 100,
            align: 'right',
            render: (valor) => Number(valor) > 0 ? (
                <span style={{ color: '#e07a5f', fontWeight: 'bold' }}>{formatarMoeda(valor)}</span>
            ) : ''
        },
        {
            title: 'Juros Mora',
            dataIndex: 'jurosDeMora',
            key: 'jurosDeMora',
            width: 100,
            align: 'right',
            render: (valor) => Number(valor) > 0 ? (
                <span style={{ color: '#d4a373', fontWeight: 'bold' }}>{formatarMoeda(valor)}</span>
            ) : ''
        },
        {
            title: 'Dias',
            dataIndex: 'diasDeMora',
            key: 'diasDeMora',
            width: 50,
            align: 'center',
            render: (valor) => Number(valor) > 0 ? valor : ''
        },
        {
            title: 'Saldo',
            dataIndex: 'saldo',
            key: 'saldo',
            width: 100,
            align: 'right',
            render: (valor) => (
                <span style={{ color: '#9b5de5', fontWeight: 'bold' }}>{formatarMoeda(valor)}</span>
            )
        },
    ];

    const { credito, cliente, linhas, totais } = dados || {};
    const valorPrestacao = credito?.numeroDePrestacoes > 0
        ? (Number(credito.valorTotal) || 0) / credito.numeroDePrestacoes
        : 0;

    return (
        <div style={{ padding: '16px' }}>
            {/* Botões de ação */}
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<FilePdfOutlined />}
                        onClick={handleGerarPDF}
                        loading={gerandoPDF}
                        size="large"
                        disabled={!dados}
                    >
                        Gerar PDF
                    </Button>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={carregarExtrato}
                        loading={loading}
                        size="large"
                    >
                        Atualizar
                    </Button>
                    {onClose && (
                        <Button icon={<CloseOutlined />} onClick={onClose} size="large">
                            Fechar
                        </Button>
                    )}
                </Space>
            </div>

            <Spin spinning={loading}>
                {dados ? (
                    <div style={{
                        maxWidth: '900px',
                        margin: '0 auto',
                        backgroundColor: '#fff',
                        padding: 24,
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                        {/* Título */}
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <Title level={3} style={{ margin: 0 }}>EXTRATO DE CRÉDITO</Title>
                            <Text type="secondary">
                                Data: {moment().format('DD/MM/YY HH:mm')}
                            </Text>
                        </div>

                        <Divider />

                        {/* Dados do Cliente */}
                        <Row gutter={16}>
                            <Col span={16}>
                                <Title level={5} style={{ margin: 0 }}>DADOS DO CLIENTE</Title>
                            </Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                                <Text>Operador: {safeString(credito?.criadoPor)}</Text>
                            </Col>
                        </Row>

                        <Descriptions size="small" column={2} style={{ marginTop: 8 }}>
                            <Descriptions.Item label="CÓDIGO DO CLIENTE">
                                <Text strong>{safeString(cliente?.codigo)}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Nome">
                                <Text strong>{safeString(cliente?.nome).toUpperCase()}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={safeString(cliente?.tipoDocumento) || 'BI'}>
                                Nº {safeString(cliente?.documento)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Telf.">
                                {safeString(cliente?.telefone)}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        {/* Dados do Crédito */}
                        <Title level={5} style={{ textAlign: 'center', margin: 0 }}>DADOS DE CRÉDITO</Title>

                        <Descriptions size="small" column={3} style={{ marginTop: 8 }}>
                            <Descriptions.Item label="Data da Concessão">
                                {credito?.dataEmissao ? moment(credito.dataEmissao).format('DD/MM/YYYY') : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="V. por prestação">
                                {formatarMoeda(valorPrestacao)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Juros">
                                {credito?.percentualDeJuros || 0}%
                            </Descriptions.Item>
                            <Descriptions.Item label="Valor Creditado">
                                <Text strong>{formatarMoeda(credito?.valorConcedido || 0)}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Juros De Mora">
                                {credito?.percentualJurosDeDemora || 0}%
                            </Descriptions.Item>
                            <Descriptions.Item label="Periodicidade">
                                {safeString(credito?.periodicidade)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Crédito Nº">
                                <Text strong>{safeString(credito?.numero)}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Nº de Prestações">
                                {credito?.numeroDePrestacoesEmDia}/{credito?.numeroDePrestacoes}
                            </Descriptions.Item>
                            <Descriptions.Item label="Forma de cálculo">
                                {safeString(credito?.formaDeCalculo)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={safeString(credito?.status) === 'QUITADO' ? 'green' : 'blue'}>
                                    {safeString(credito?.status)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Total Pago">
                                <Text strong style={{ color: '#3f8600' }}>{formatarMoeda(credito?.totalPago || 0)}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Saldo Devedor">
                                <Text strong style={{ color: '#cf1322' }}>{formatarMoeda(credito?.totalEmDivida || 0)}</Text>
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        {/* Tabela de Extrato */}
                        <Title level={5}>MOVIMENTOS</Title>
                        <Table
                            columns={columns}
                            dataSource={linhas || []}
                            rowKey={(record, index) => index}
                            size="small"
                            pagination={false}
                            scroll={{ x: 750 }}
                            locale={{ emptyText: 'Nenhum movimento' }}
                            summary={() => {
                                if (!totais) return null;
                                return (
                                    <Table.Summary>
                                        <Table.Summary.Row style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                            <Table.Summary.Cell colSpan={2}>
                                                TOTAIS
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell align="right" style={{ color: '#1b4332' }}>
                                                {formatarMoeda(totais.totalDebito || 0)}
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell align="right" style={{ color: '#0077b6' }}>
                                                {formatarMoeda(totais.totalCredito || 0)}
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell align="right" style={{ color: '#e07a5f' }}>
                                                {formatarMoeda(totais.totalMoras || 0)}
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell align="right" style={{ color: '#d4a373' }}>
                                                {formatarMoeda(totais.totalJurosDeMora || 0)}
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell></Table.Summary.Cell>
                                            <Table.Summary.Cell align="right" style={{ color: '#9b5de5' }}>
                                                {formatarMoeda(totais.totalEmMora || 0)}
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </Table.Summary>
                                );
                            }}
                        />
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: 60 }}>
                        <Text type="secondary">Carregando extrato...</Text>
                    </div>
                )}
            </Spin>
        </div>
    );
};

export default ExtratoCreditoModal;