// src/components/credito/SimuladorCredito.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, InputNumber, Select, Button, Table, Typography, Divider, Alert, Space, Tag, message, Statistic } from 'antd';
import { CalculatorOutlined, ReloadOutlined, DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import moment from 'moment';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import creditoService from '../../services/creditoService';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor || 0);
};

const SimuladorCredito = () => {
    const [loading, setLoading] = useState(false);
    const [definicoes, setDefinicoes] = useState([]);
    const [form] = Form.useForm();
    const [simulacao, setSimulacao] = useState(null);
    const [parcelasSimuladas, setParcelasSimuladas] = useState([]);

    // Carregar definições de crédito ao montar
    useEffect(() => {
        carregarDefinicoes();
    }, []);

    const carregarDefinicoes = async () => {
        try {
            const data = await creditoService.listarDefinicoes();
            console.log('📋 Definições carregadas:', data);
            if (data && data.length > 0) {
                console.log('📋 Primeira definição:', JSON.stringify(data[0], null, 2));
            }
            const definicoesAtivas = Array.isArray(data) ? data.filter(d => d.ativo) : [];
            setDefinicoes(definicoesAtivas);
        } catch (error) {
            console.error('Erro ao carregar definições:', error);
            message.error('Erro ao carregar definições de crédito');
        }
    };

    const handleSimular = async (values) => {
        try {
            setLoading(true);
            const definicaoSelecionada = definicoes.find(d => d.id === values.definicaoId);
            
            if (!definicaoSelecionada) {
                message.error('Selecione uma definição de crédito');
                return;
            }

            const resultado = await creditoService.simularCredito({
                valorConcedido: values.valorConcedido,
                definicaoId: values.definicaoId,
                numeroDePrestacoes: values.numeroDePrestacoes || definicaoSelecionada.numeroDePrestacoes,
                percentualDeJuros: values.percentualDeJuros !== undefined ? values.percentualDeJuros : definicaoSelecionada.percentualDeJuros,
                formaDeCalculo: values.formaDeCalculo || definicaoSelecionada.formaDeCalculo,
                periodicidade: values.periodicidade || definicaoSelecionada.periodicidade
            });

            setSimulacao(resultado);
            setParcelasSimuladas(resultado.parcelas || []);
            message.success('Simulação realizada com sucesso!');
        } catch (error) {
            console.error('Erro na simulação:', error);
            message.error('Erro ao realizar simulação');
        } finally {
            setLoading(false);
        }
    };

    const handleLimpar = () => {
        form.resetFields();
        setSimulacao(null);
        setParcelasSimuladas([]);
    };

    const exportarExcel = () => {
        if (!simulacao || parcelasSimuladas.length === 0) {
            message.warning('Nenhuma simulação para exportar');
            return;
        }

        const dados = parcelasSimuladas.map(p => ({
            'Nº Parcela': p.numero,
            'Data Vencimento': moment(p.dataVencimento).format('DD/MM/YYYY'),
            'Valor Parcela': p.valorParcela,
            'Amortização': p.valorAmortizacao || 0,
            'Juros': p.valorJuros || 0,
            'Saldo Devedor': p.saldoDevedor || 0
        }));

        const ws = XLSX.utils.json_to_sheet(dados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Simulação');
        
        const nomeArquivo = `Simulacao_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
        XLSX.writeFile(wb, nomeArquivo);
        message.success('Excel exportado com sucesso!');
    };

    const exportarPDF = () => {
        if (!simulacao || parcelasSimuladas.length === 0) {
            message.warning('Nenhuma simulação para exportar');
            return;
        }

        try {
            message.loading({ content: 'Gerando PDF...', key: 'pdf' });

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pw = doc.internal.pageSize.getWidth();
            const m = 12;
            let y = m;

            // TÍTULO
            doc.setFontSize(14).setFont('helvetica', 'bold');
            doc.text('SIMULAÇÃO DE PLANO DE PAGAMENTO', pw / 2, y + 5, { align: 'center' });
            y += 14;
            doc.setDrawColor(0).setLineWidth(0.3).line(m, y, pw - m, y);
            y += 6;

            // DADOS DA SIMULAÇÃO
            doc.setFontSize(8).setFont('helvetica', 'bold');
            doc.text('DADOS DA SIMULAÇÃO', m, y);
            y += 5;
            doc.setFontSize(7).setFont('helvetica', 'normal');

            const colE = m;
            let ye = y;
            doc.setFont('helvetica', 'bold');
            doc.text('Definição:', colE, ye);
            doc.setFont('helvetica', 'normal');
            doc.text(String(simulacao.definicaoNome || '-'), colE + 22, ye); ye += 4;

            doc.setFont('helvetica', 'bold');
            doc.text('Forma Calc.:', colE, ye);
            doc.setFont('helvetica', 'normal');
            doc.text(String(simulacao.formaDeCalculo?.name || '-'), colE + 22, ye); ye += 4;

            doc.setFont('helvetica', 'bold');
            doc.text('Periodic.:', colE, ye);
            doc.setFont('helvetica', 'normal');
            doc.text(String(simulacao.periodicidade?.name || '-'), colE + 22, ye); ye += 4;

            const colD = pw / 2 + 10;
            let yd = y;
            doc.setFont('helvetica', 'bold');
            doc.text('Juros:', colD, yd);
            doc.setFont('helvetica', 'normal');
            doc.text(String(simulacao.percentualDeJuros || 0) + '%', colD + 18, yd); yd += 4;

            doc.setFont('helvetica', 'bold');
            doc.text('Prestações:', colD, yd);
            doc.setFont('helvetica', 'normal');
            doc.text(String(simulacao.numeroDePrestacoes || 0), colD + 18, yd); yd += 4;

            y = Math.max(ye, yd) + 4;

            // Valor Concedido e Totais
            const vf = Number(simulacao.valorConcedido || 0).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });
            const vt = Number(simulacao.valorTotal || 0).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });
            const tj = Number(simulacao.totalJuros || 0).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

            doc.setFontSize(9).setFont('helvetica', 'bold');
            doc.text('VALOR CONCEDIDO: ' + vf, m, y); y += 5;
            doc.text('TOTAL EM JUROS: ' + tj, m, y); y += 5;
            doc.text('TOTAL A PAGAR: ' + vt, m, y); y += 8;

            // TABELA DE PARCELAS
            if (parcelasSimuladas && parcelasSimuladas.length > 0) {
                const fmt = (v) => {
                    const n = Number(v) || 0;
                    return n.toFixed(2).replace('.', ',') + ' MTn';
                };

                const body = parcelasSimuladas.map(p => {
                    let d = '-';
                    if (p.dataVencimento) {
                        const mm = moment(p.dataVencimento);
                        d = mm.isValid() ? mm.format('DD/MM/YY') : String(p.dataVencimento).substring(0, 10);
                    }
                    return [
                        String(p.numero || ''),
                        String(p.numero || '') + 'a',
                        String(d),
                        fmt(p.valorParcela),
                        fmt(p.valorAmortizacao),
                        fmt(p.valorJuros),
                        fmt(p.saldoDevedor),
                    ];
                });

                const tp = parcelasSimuladas.reduce((s, p) => s + (Number(p.valorParcela) || 0), 0);
                const ta = parcelasSimuladas.reduce((s, p) => s + (Number(p.valorAmortizacao) || 0), 0);
                const tjTable = parcelasSimuladas.reduce((s, p) => s + (Number(p.valorJuros) || 0), 0);

                const head = ['N', 'Desc', 'Vencimento', 'Prestação', 'Amortização', 'Juros', 'Saldo Dev.'];
                const foot = ['', '', 'TOTAIS', fmt(tp), fmt(ta), fmt(tjTable), ''];

                doc.autoTable({
                    startY: y,
                    head: [head],
                    body: body,
                    foot: [foot],
                    styles: { fontSize: 6.5, cellPadding: 1.2 },
                    headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: 'bold', halign: 'center', minCellHeight: 6 },
                    footStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', minCellHeight: 6 },
                    margin: { left: m, right: m },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 10 },
                        1: { halign: 'center', cellWidth: 14 },
                        2: { halign: 'center', cellWidth: 22 },
                        3: { halign: 'right', cellWidth: 26 },
                        4: { halign: 'right', cellWidth: 26 },
                        5: { halign: 'right', cellWidth: 22 },
                        6: { halign: 'right', cellWidth: 26 },
                    },
                });

                y = doc.lastAutoTable.finalY + 8;
            }

            // Rodapé informativo
            if (y < 265) {
                doc.setFontSize(6).setFont('helvetica', 'italic');
                doc.setTextColor(100, 100, 100);
                doc.text('Este é um documento de simulação. Os valores podem variar na concessão real do crédito.', pw / 2, y, { align: 'center' });
                y += 4;
                doc.text('Data da simulação: ' + moment().format('DD/MM/YYYY HH:mm:ss'), pw / 2, y, { align: 'center' });
                doc.setTextColor(0, 0, 0);
            }

            // Salvar
            const fileName = `Simulacao_${moment().format('YYYYMMDD_HHmmss')}.pdf`;
            doc.save(fileName);
            message.success({ content: 'PDF gerado com sucesso!', key: 'pdf' });
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            message.error({ content: 'Erro ao gerar PDF', key: 'pdf' });
        }
    };

    const columns = [
        { 
            title: 'Nº', 
            dataIndex: 'numero', 
            width: 60,
            align: 'center'
        },
        { 
            title: 'Vencimento', 
            dataIndex: 'dataVencimento',
            render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-',
            width: 120
        },
        { 
            title: 'Valor Parcela', 
            dataIndex: 'valorParcela',
            render: (v) => <Text strong>{formatarMoeda(v)}</Text>,
            align: 'right',
            width: 140
        },
        { 
            title: 'Amortização', 
            dataIndex: 'valorAmortizacao',
            render: (v) => formatarMoeda(v || 0),
            align: 'right',
            width: 130
        },
        { 
            title: 'Juros', 
            dataIndex: 'valorJuros',
            render: (v) => formatarMoeda(v || 0),
            align: 'right',
            width: 120
        },
        { 
            title: 'Saldo Devedor', 
            dataIndex: 'saldoDevedor',
            render: (v) => formatarMoeda(v || 0),
            align: 'right',
            width: 140
        }
    ];

    const definicaoSelecionada = form.getFieldValue('definicaoId') 
        ? definicoes.find(d => d.id === form.getFieldValue('definicaoId'))
        : null;

    return (
        <div>
            <Title level={3}>
                <CalculatorOutlined /> Simulador de Crédito
            </Title>
            <Text type="secondary">
                Simule diferentes cenários de crédito antes de conceder
            </Text>

            <Divider />

            {/* Formulário de Simulação */}
            <Card title="Parâmetros da Simulação" size="small" style={{ marginBottom: 16 }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSimular}
                    initialValues={{
                        numeroDePrestacoes: undefined,
                        percentualDeJuros: undefined
                    }}
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="definicaoId"
                                label="Definição de Crédito"
                                rules={[{ required: true, message: 'Selecione uma definição' }]}
                            >
                                <Select
                                    placeholder="Selecione a definição base"
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={definicoes.map(d => {
                                        const periodicidadeStr = d.periodicidade?.name || 'N/A';
                                        const label = `${d.nome} - ${d.numeroDePrestacoes}x ${periodicidadeStr}`;
                                        return {
                                            value: d.id,
                                            label: label,
                                            definicao: d
                                        };
                                    })}
                                    onChange={() => form.setFieldsValue({
                                        numeroDePrestacoes: undefined,
                                        percentualDeJuros: undefined
                                    })}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                name="valorConcedido"
                                label="Valor Concedido (MZN)"
                                rules={[{ required: true, message: 'Informe o valor' }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={100}
                                    step={100}
                                    formatter={value => `MZN ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/MZN\s?|(,*)/g, '')}
                                    placeholder="Ex: 50000"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                name="numeroDePrestacoes"
                                label="Número de Prestações (opcional)"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={1}
                                    max={360}
                                    placeholder={definicaoSelecionada ? `Padrão: ${definicaoSelecionada.numeroDePrestacoes}` : ''}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                name="percentualDeJuros"
                                label="Taxa de Juros % (opcional)"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    max={100}
                                    step={0.01}
                                    placeholder={definicaoSelecionada ? `Padrão: ${definicaoSelecionada.percentualDeJuros}%` : ''}
                                    formatter={value => `${value}%`}
                                    parser={value => value.replace('%', '')}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                name="formaDeCalculo"
                                label="Forma de Cálculo (opcional)"
                            >
                                <Select
                                    placeholder={definicaoSelecionada ? `Padrão: ${definicaoSelecionada.formaDeCalculo?.name || 'N/A'}` : ''}
                                    allowClear
                                >
                                    <Option value="TAXA_FIXA">Taxa Fixa</Option>
                                    <Option value="PMT">PMT - Prestações Fixas</Option>
                                    <Option value="SAC">SAC - Amortização Constante</Option>
                                    <Option value="JUROS_SIMPLES">Juros Simples</Option>
                                    <Option value="JUROS_COMPOSTOS">Juros Compostos</Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                name="periodicidade"
                                label="Periodicidade (opcional)"
                            >
                                <Select
                                    placeholder={definicaoSelecionada ? `Padrão: ${definicaoSelecionada.periodicidade?.name || 'N/A'}` : ''}
                                    allowClear
                                >
                                    <Option value="DIARIO">Diário</Option>
                                    <Option value="SEMANAL">Semanal</Option>
                                    <Option value="QUINZENAL">Quinzenal</Option>
                                    <Option value="MENSAL">Mensal</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider style={{ margin: '12px 0' }} />

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading} icon={<CalculatorOutlined />}>
                                Simular
                            </Button>
                            <Button onClick={handleLimpar} icon={<ReloadOutlined />}>
                                Limpar
                            </Button>
                            {simulacao && (
                                <>
                                    <Button onClick={exportarPDF} icon={<FilePdfOutlined />}>
                                        Exportar PDF
                                    </Button>
                                    <Button onClick={exportarExcel} icon={<DownloadOutlined />}>
                                        Exportar Excel
                                    </Button>
                                </>
                            )}
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            {/* Resultados da Simulação */}
            {simulacao && (
                <>
                    <Alert
                        message="Resultado da Simulação"
                        description={`Crédito simulado com base na definição "${simulacao.definicaoNome}"`}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    {/* Resumo Financeiro */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                        <Col xs={24} sm={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Valor Concedido"
                                    value={simulacao.valorConcedido}
                                    precision={2}
                                    prefix="MZN"
                                    valueStyle={{ fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total em Juros"
                                    value={simulacao.totalJuros}
                                    precision={2}
                                    prefix="MZN"
                                    valueStyle={{ color: '#cf1322', fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total a Pagar"
                                    value={simulacao.valorTotal}
                                    precision={2}
                                    prefix="MZN"
                                    valueStyle={{ color: '#3f8600', fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Prestação"
                                    value={simulacao.numeroDePrestacoes}
                                    suffix={`x ${simulacao.periodicidade?.name || 'N/A'}`}
                                    valueStyle={{ fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Tabela de Parcelas */}
                    <Card 
                        title={`Plano de Pagamento (${parcelasSimuladas.length} parcelas)`}
                        size="small"
                        extra={
                            <Tag color="blue">
                                {simulacao.formaDeCalculo?.name || 'N/A'}
                            </Tag>
                        }
                    >
                        <Table
                            columns={columns}
                            dataSource={parcelasSimuladas}
                            rowKey="numero"
                            size="small"
                            pagination={{ pageSize: 12, showTotal: total => `Total: ${total} parcelas` }}
                            scroll={{ x: 800 }}
                            summary={() => (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={2}>
                                        <Text strong>TOTAL</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right">
                                        <Text strong>{formatarMoeda(parcelasSimuladas.reduce((s, p) => s + (p.valorParcela || 0), 0))}</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} align="right">
                                        <Text strong>{formatarMoeda(parcelasSimuladas.reduce((s, p) => s + (p.valorAmortizacao || 0), 0))}</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={3} align="right">
                                        <Text strong>{formatarMoeda(parcelasSimuladas.reduce((s, p) => s + (p.valorJuros || 0), 0))}</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4} />
                                </Table.Summary.Row>
                            )}
                        />
                    </Card>
                </>
            )}
        </div>
    );
};

export default SimuladorCredito;
