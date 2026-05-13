// src/components/relatorios/RelatorioCreditosEmitidos.jsx
import React, { useState } from 'react';
import { Card, Form, DatePicker, Button, Table, Typography, Divider, Space, message, Tag } from 'antd';
import { SearchOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import relatorioService from '../../services/relatorioService';
import moment from 'moment';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 2
    }).format(valor || 0);
};

const RelatorioCreditosEmitidos = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState(null);

    const handleGerar = async (values) => {
        try {
            setLoading(true);
            const dataInicio = values.periodo[0].format('YYYY-MM-DD');
            const dataFim = values.periodo[1].format('YYYY-MM-DD');

            const resultado = await relatorioService.creditosEmitidos(dataInicio, dataFim);
            setDados(resultado);
            message.success('Relatório gerado com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            message.error('Erro ao gerar relatório');
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        if (!dados) return;

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pw = doc.internal.pageSize.getWidth();
        const m = 10;
        let y = 15;

        // Título
        doc.setFontSize(16).setFont('helvetica', 'bold');
        doc.text('RELATÓRIO DE CRÉDITOS EMITIDOS', pw / 2, y, { align: 'center' });
        y += 8;

        doc.setFontSize(9).setFont('helvetica', 'normal');
        const periodo = form.getFieldValue('periodo');
        doc.text(`Período: ${periodo[0].format('DD/MM/YYYY')} a ${periodo[1].format('DD/MM/YYYY')}`, m, y);
        y += 5;
        doc.text(`Data de Emissão: ${moment().format('DD/MM/YYYY HH:mm')}`, m, y);
        y += 10;

        // Tabela
        const head = [['Nº Crédito', 'Data', 'Cliente', 'Valor Concedido', 'Valor Total', 'Total Pago', 'Saldo', 'Status']];
        
        const body = dados.creditos.map(c => [
            c.numero,
            moment(c.dataEmissao).format('DD/MM/YY'),
            c.entidadeNome,
            formatarMoeda(c.valorConcedido),
            formatarMoeda(c.valorTotal),
            formatarMoeda(c.totalPago),
            formatarMoeda(c.saldoDevedor),
            c.status
        ]);

        doc.autoTable({
            startY: y,
            head: head,
            body: body,
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [24, 144, 255], textColor: 255, fontStyle: 'bold' },
            margin: { left: m, right: m },
        });

        y = doc.lastAutoTable.finalY + 10;

        // Totais
        doc.setFontSize(10).setFont('helvetica', 'bold');
        doc.text('RESUMO', m, y);
        y += 6;
        doc.setFontSize(8);
        doc.text(`Total de Créditos: ${dados.totais.totalCreditos}`, m, y); y += 5;
        doc.text(`Valor Total Concedido: ${formatarMoeda(dados.totais.valorTotalConcedido)}`, m, y); y += 5;
        doc.text(`Valor Total a Pagar: ${formatarMoeda(dados.totais.valorTotalAPagar)}`, m, y); y += 5;
        doc.text(`Valor Total Pago: ${formatarMoeda(dados.totais.valorTotalPago)}`, m, y); y += 5;
        doc.text(`Saldo Total Devedor: ${formatarMoeda(dados.totais.saldoTotalDevedor)}`, m, y);

        doc.save(`Relatorio_Creditos_Emitidos_${moment().format('YYYYMMDD_HHmmss')}.pdf`);
        message.success('PDF exportado com sucesso!');
    };

    const handleExportExcel = () => {
        if (!dados) return;

        const wb = XLSX.utils.book_new();

        // Metadados
        const headerData = [
            ['RELATÓRIO DE CRÉDITOS EMITIDOS'],
            ['Período:', `${form.getFieldValue('periodo')[0].format('DD/MM/YYYY')} a ${form.getFieldValue('periodo')[1].format('DD/MM/YYYY')}`],
            ['Data de Emissão:', moment().format('DD/MM/YYYY HH:mm')],
            [],
        ];

        // Dados da tabela
        const tableHeaders = ['Nº Crédito', 'Data Emissão', 'Cliente', 'Código', 'Valor Concedido', 'Valor Total', 'Total Pago', 'Saldo Devedor', 'Prestações', 'Periodicidade', 'Status', 'Gestor'];
        
        const tableData = dados.creditos.map(c => [
            c.numero,
            moment(c.dataEmissao).format('DD/MM/YYYY'),
            c.entidadeNome,
            c.entidadeCodigo,
            c.valorConcedido,
            c.valorTotal,
            c.totalPago,
            c.saldoDevedor,
            c.numeroDePrestacoes,
            c.periodicidade,
            c.status,
            c.criadoPor
        ]);

        // Linha de totais
        const totalsRow = [
            '', '', 'TOTAIS', '', 
            dados.totais.valorTotalConcedido,
            dados.totais.valorTotalAPagar,
            dados.totais.valorTotalPago,
            dados.totais.saldoTotalDevedor,
            '', '', '', ''
        ];

        const ws = XLSX.utils.aoa_to_sheet([...headerData, tableHeaders, ...tableData, totalsRow]);
        XLSX.utils.book_append_sheet(wb, ws, 'Créditos Emitidos');
        
        const fileName = `Relatorio_Creditos_Emitidos_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        message.success('Excel exportado com sucesso!');
    };

    const columns = [
        { title: 'Nº Crédito', dataIndex: 'numero', key: 'numero', width: 120 },
        { 
            title: 'Data Emissão', 
            dataIndex: 'dataEmissao', 
            key: 'dataEmissao',
            render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-',
            width: 110
        },
        { title: 'Cliente', dataIndex: 'entidadeNome', key: 'entidadeNome', ellipsis: true },
        { title: 'Código', dataIndex: 'entidadeCodigo', key: 'entidadeCodigo', width: 100 },
        { 
            title: 'Valor Concedido', 
            dataIndex: 'valorConcedido', 
            key: 'valorConcedido',
            render: (v) => formatarMoeda(v),
            align: 'right',
            width: 130
        },
        { 
            title: 'Valor Total', 
            dataIndex: 'valorTotal', 
            key: 'valorTotal',
            render: (v) => formatarMoeda(v),
            align: 'right',
            width: 130
        },
        { 
            title: 'Total Pago', 
            dataIndex: 'totalPago', 
            key: 'totalPago',
            render: (v) => formatarMoeda(v),
            align: 'right',
            width: 130
        },
        { 
            title: 'Saldo', 
            dataIndex: 'saldoDevedor', 
            key: 'saldoDevedor',
            render: (v) => <Text strong style={{ color: v > 0 ? '#ff4d4f' : '#52c41a' }}>{formatarMoeda(v)}</Text>,
            align: 'right',
            width: 130
        },
        { title: 'Prest.', dataIndex: 'numeroDePrestacoes', key: 'numeroDePrestacoes', width: 70, align: 'center' },
        { title: 'Period.', dataIndex: 'periodicidade', key: 'periodicidade', width: 90 },
        { 
            title: 'Status', 
            dataIndex: 'status', 
            key: 'status',
            render: (s) => {
                const color = s === 'QUITADO' ? 'green' : s === 'CANCELADO' ? 'red' : 'blue';
                return <Tag color={color}>{s}</Tag>;
            },
            width: 100
        },
        { title: 'Gestor', dataIndex: 'criadoPor', key: 'criadoPor', width: 120 },
    ];

    return (
        <div>
            <Title level={3}>📄 Relatório de Créditos Emitidos</Title>
            <Text type="secondary">Visualize todos os créditos concedidos em um período específico</Text>

            <Divider />

            {/* Filtros */}
            <Card size="small" style={{ marginBottom: 16 }}>
                <Form form={form} layout="inline" onFinish={handleGerar}>
                    <Form.Item
                        name="periodo"
                        label="Período"
                        rules={[{ required: true, message: 'Selecione o período' }]}
                    >
                        <RangePicker style={{ width: 300 }} />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
                                Gerar Relatório
                            </Button>
                            {dados && (
                                <>
                                    <Button onClick={handleExportPDF} icon={<FilePdfOutlined />}>
                                        Exportar PDF
                                    </Button>
                                    <Button onClick={handleExportExcel} icon={<FileExcelOutlined />}>
                                        Exportar Excel
                                    </Button>
                                </>
                            )}
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            {/* Resultados */}
            {dados && (
                <>
                    {/* Resumo */}
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Space size="large">
                            <div>
                                <Text type="secondary">Total de Créditos:</Text><br />
                                <Text strong style={{ fontSize: 18 }}>{dados.totais.totalCreditos}</Text>
                            </div>
                            <div>
                                <Text type="secondary">Valor Concedido:</Text><br />
                                <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                                    {formatarMoeda(dados.totais.valorTotalConcedido)}
                                </Text>
                            </div>
                            <div>
                                <Text type="secondary">Valor Total a Pagar:</Text><br />
                                <Text strong style={{ fontSize: 18 }}>
                                    {formatarMoeda(dados.totais.valorTotalAPagar)}
                                </Text>
                            </div>
                            <div>
                                <Text type="secondary">Total Recebido:</Text><br />
                                <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                                    {formatarMoeda(dados.totais.valorTotalPago)}
                                </Text>
                            </div>
                            <div>
                                <Text type="secondary">Saldo Devedor:</Text><br />
                                <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                                    {formatarMoeda(dados.totais.saldoTotalDevedor)}
                                </Text>
                            </div>
                        </Space>
                    </Card>

                    {/* Tabela */}
                    <Table
                        columns={columns}
                        dataSource={dados.creditos}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 20, showTotal: total => `Total: ${total} créditos` }}
                        scroll={{ x: 1400 }}
                    />
                </>
            )}
        </div>
    );
};

export default RelatorioCreditosEmitidos;
