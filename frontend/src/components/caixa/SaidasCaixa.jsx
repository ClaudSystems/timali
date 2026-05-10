// src/components/caixa/SaidasCaixa.jsx
import React, { useState, useCallback, useContext, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Select, Input, InputNumber, Typography, Space, Tag, message, DatePicker, Modal, Form, Statistic } from 'antd';
import { PlusOutlined, DollarOutlined, DeleteOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import moment from 'moment';
import saidaCaixaService from '../../services/saidaCaixaService';
import SettingsContext from '../../contexts/SettingsContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const formatarMoeda = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', minimumFractionDigits: 2 }).format(v || 0);

const TIPOS_SAIDA = {
    'DESPESA': { label: 'Despesa', color: 'red' },
    'REEMBOLSO': { label: 'Reembolso', color: 'orange' },
    'FORNECEDOR': { label: 'Fornecedor', color: 'purple' },
    'SALARIO': { label: 'Salário', color: 'blue' },
    'MATERIAL': { label: 'Material', color: 'cyan' },
    'SERVICO': { label: 'Serviço', color: 'geekblue' },
    'FEICHO_CAIXA': { label: 'Fecho de Caixa', color: 'gold' },
    'OUTRO': { label: 'Outro', color: 'default' }
};

const FORMAS_PAGAMENTO = ['DINHEIRO', 'TRANSFERENCIA', 'CHEQUE', 'CARTEIRA_MOVEL', 'CARTAO'];

const getNomeOperador = () => {
    try {
        const ur = localStorage.getItem('timali_user');
        if (ur && ur !== 'undefined' && ur !== 'null') {
            try { const u = JSON.parse(ur); if (u && typeof u === 'object') return u.nome || u.username || 'Operador'; } catch (e) { return ur; }
        }
        return 'Operador';
    } catch (e) { return 'Operador'; }
};

const SaidasCaixa = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    // INICIAR COM O DIA ATUAL
    const [periodo, setPeriodo] = useState([moment().startOf('day'), moment().endOf('day')]);
    const [tipoFiltro, setTipoFiltro] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [resumo, setResumo] = useState(null);
    const [form] = Form.useForm();

    const settingsContext = useContext(SettingsContext);
    const podeAlterarData = settingsContext?.settings?.alterarDataPagamento === true;

    const buscar = useCallback(async () => {
        if (!periodo || periodo.length !== 2) return;
        try {
            setLoading(true);
            const dataInicio = periodo[0].format('YYYY-MM-DD');
            const dataFim = periodo[1].format('YYYY-MM-DD');

            const d = await saidaCaixaService.porPeriodo(dataInicio, dataFim, tipoFiltro);
            setData(Array.isArray(d) ? d : []);

            const r = await saidaCaixaService.resumo(dataInicio, dataFim);
            setResumo(r);
        } catch (e) {
            console.error('Erro ao buscar:', e);
            setData([]);
            setResumo(null);
        } finally {
            setLoading(false);
        }
    }, [periodo, tipoFiltro]);

    // Buscar ao montar e quando filtros mudarem
    useEffect(() => {
        buscar();
    }, [buscar]);

    const handleHoje = () => {
        const hoje = moment();
        setPeriodo([hoje.clone().startOf('day'), hoje.clone().endOf('day')]);
    };

    const handleMesAtual = () => {
        setPeriodo([moment().startOf('month'), moment().endOf('month')]);
    };

    const handleRegistrar = async (values) => {
        try {
            const payload = {
                ...values,
                criadoPor: getNomeOperador(),
                dataSaida: values.dataSaida ? values.dataSaida.toISOString() : new Date().toISOString()
            };
            await saidaCaixaService.criar(payload);
            message.success('Saída registrada com sucesso!');
            setModalAberto(false);
            form.resetFields();
            buscar();
        } catch (e) {
            message.error('Erro ao registar saída');
            console.error('Erro:', e);
        }
    };

    const handleExcluir = async (id) => {
        Modal.confirm({
            title: 'Confirmar exclusão',
            content: 'Deseja realmente excluir esta saída?',
            onOk: async () => {
                try {
                    await saidaCaixaService.excluir(id);
                    message.success('Saída excluída!');
                    buscar();
                } catch (e) {
                    message.error('Erro ao excluir');
                }
            }
        });
    };

    const columns = [
        { title: 'Data', dataIndex: 'dataSaida', render: (d) => d ? moment(d).format('DD/MM/YYYY HH:mm') : '-', width: 140 },
        { title: 'Tipo', dataIndex: 'tipo', render: (t) => <Tag color={TIPOS_SAIDA[t]?.color}>{TIPOS_SAIDA[t]?.label || t}</Tag>, width: 100 },
        { title: 'Descrição', dataIndex: 'descricao', ellipsis: true },
        { title: 'Valor', dataIndex: 'valor', render: (v) => <Text strong style={{ color: '#cf1322' }}>{formatarMoeda(v)}</Text>, align: 'right', width: 120 },
        { title: 'Forma', dataIndex: 'formaPagamento', render: (f) => <Tag>{f}</Tag>, width: 120 },
        { title: 'Referência', dataIndex: 'referencia', render: (r) => r || '-', width: 100 },
        { title: 'Operador', dataIndex: 'criadoPor', width: 100 },
        { title: 'Ação', fixed: 'right', width: 80, render: (_, record) => (
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleExcluir(record.id)} size="small" />
        )}
    ];

    return (
        <div>
            <Title level={4} style={{ marginTop: 0 }}><DollarOutlined /> Saídas de Caixa</Title>

            <Card size="small" style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} sm={12} md={6}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Período</Text>
                        <RangePicker
                            value={periodo}
                            onChange={(dates) => { if (dates) setPeriodo(dates); }}
                            format="DD/MM/YYYY"
                            style={{ width: '100%' }}
                            placeholder={['Data Início', 'Data Fim']}
                            allowClear={false}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Tipo</Text>
                        <Select value={tipoFiltro} onChange={setTipoFiltro} allowClear placeholder="Todos" style={{ width: '100%' }}>
                            {Object.entries(TIPOS_SAIDA).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>&nbsp;</Text>
                        <Space>
                            <Button type="primary" icon={<FilterOutlined />} onClick={buscar}>Filtrar</Button>
                            <Button icon={<ReloadOutlined />} onClick={handleHoje}>Hoje</Button>
                            <Button onClick={handleMesAtual}>Mês</Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalAberto(true)}>Nova Saída</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {resumo && (
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Saídas" value={resumo.totalSaidas} suffix="registos" /></Card></Col>
                    <Col xs={12} sm={6}><Card size="small"><Statistic title="Valor Total" value={resumo.valorTotal} formatter={(v) => formatarMoeda(v)} /></Card></Col>
                    <Col xs={24} sm={12}>
                        <Card size="small">
                            {resumo.porTipo && Object.entries(resumo.porTipo).map(([tipo, info]) => (
                                <Tag key={tipo} color={TIPOS_SAIDA[tipo]?.color} style={{ marginBottom: 4 }}>
                                    {TIPOS_SAIDA[tipo]?.label}: {info.quantidade} ({formatarMoeda(info.total)})
                                </Tag>
                            ))}
                        </Card>
                    </Col>
                </Row>
            )}

            <Card>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    size="small"
                    loading={loading}
                    pagination={{ pageSize: 20, showTotal: t => `Total: ${t} saídas` }}
                    scroll={{ x: 900 }}
                    locale={{ emptyText: 'Nenhuma saída no período' }}
                />
            </Card>

            <Modal
                title="Registrar Saída de Caixa"
                open={modalAberto}
                onCancel={() => setModalAberto(false)}
                footer={null}
                width={500}
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={handleRegistrar}>
                    <Form.Item label="Tipo" name="tipo" rules={[{ required: true, message: 'Selecione o tipo' }]}>
                        <Select placeholder="Selecione o tipo">
                            {Object.entries(TIPOS_SAIDA).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item label="Descrição" name="descricao" rules={[{ required: true, message: 'Descreva a saída' }]}>
                        <Input.TextArea rows={2} placeholder="Descreva a saída..." />
                    </Form.Item>
                    <Form.Item label="Valor" name="valor" rules={[{ required: true, message: 'Informe o valor' }]}>
                        <InputNumber style={{ width: '100%' }} min={0.01} step={0.01} placeholder="0,00"
                            formatter={v => `MZN ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={v => v.replace(/MZN\s?|(,*)/g, '')} />
                    </Form.Item>
                    <Form.Item label="Forma de Pagamento" name="formaPagamento" rules={[{ required: true, message: 'Selecione a forma' }]}>
                        <Select placeholder="Selecione">
                            {FORMAS_PAGAMENTO.map(f => <Option key={f} value={f}>{f}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item label="Referência/Documento" name="referencia">
                        <Input placeholder="Nº do documento" />
                    </Form.Item>
                    {podeAlterarData && (
                        <Form.Item label="Data da Saída" name="dataSaida">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                    )}
                    <Button type="primary" htmlType="submit" block size="large" icon={<DollarOutlined />}>
                        Registrar Saída
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default SaidasCaixa;