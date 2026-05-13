// src/components/relatorios/RelatorioDiarios.jsx
import React, { useState } from 'react';
import { Card, Form, DatePicker, Button, Table, Typography, Divider, Space, message } from 'antd';
import { SearchOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import relatorioService from '../../services/relatorioService';
import moment from 'moment';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const formatarMoeda = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(v || 0);

const RelatorioDiarios = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState(null);

    const handleGerar = async (values) => {
        try {
            setLoading(true);
            const dataInicio = values.periodo[0].format('YYYY-MM-DD');
            const dataFim = values.periodo[1].format('YYYY-MM-DD');
            const resultado = await relatorioService.diarios(dataInicio, dataFim);
            setDados(resultado);
            message.success('Relatório gerado!');
        } catch (error) {
            console.error('Erro:', error);
            message.error('Erro ao gerar relatório');
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        if (!dados) return;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.setFontSize(16);
        doc.text('RELATÓRIO DE DIÁRIOS', 148, 15, { align: 'center' });
        doc.setFontSize(10);
        const periodo = form.getFieldValue('periodo');
        if (periodo) doc.text(`Período: ${periodo[0].format('DD/MM/YYYY')} a ${periodo[1].format('DD/MM/YYYY')}`, 14, 25);
        doc.setFontSize(11);
        doc.text(`Total Dias: ${dados.totais.totalDias} | Entradas: ${formatarMoeda(dados.totais.totalEntradas)} | Saídas: ${formatarMoeda(dados.totais.totalSaidas)}`, 14, 35);
        
        const tableData = dados.diarios.map(d => [
            d.dataDiario ? moment(d.dataDiario).format('DD/MM/YYYY') : '-',
            formatarMoeda(d.saldoInicial),
            formatarMoeda(d.totalEntradas),
            formatarMoeda(d.totalSaidas),
            formatarMoeda(d.saldoFinal),
            d.fechado ? 'Sim' : 'Não',
            d.responsavel || '-'
        ]);
        
        doc.autoTable({
            startY: 45,
            head: [['Data', 'Saldo Inicial', 'Entradas', 'Saídas', 'Saldo Final', 'Fechado', 'Responsável']],
            body: tableData,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [24, 144, 255], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });
        doc.save(`Relatorio_Diarios_${moment().format('YYYYMMDD_HHmmss')}.pdf`);
        message.success('PDF exportado!');
    };

    const handleExportExcel = () => {
        if (!dados) return;
        const wb = XLSX.utils.book_new();
        const headerData = [
            ['RELATÓRIO DE DIÁRIOS'],
            [`Período: ${form.getFieldValue('periodo')?.[0].format('DD/MM/YYYY')} a ${form.getFieldValue('periodo')?.[1].format('DD/MM/YYYY')}`],
            [],
            ['RESUMO'],
            ['Total Dias', dados.totais.totalDias],
            ['Total Entradas', formatarMoeda(dados.totais.totalEntradas)],
            ['Total Saídas', formatarMoeda(dados.totais.totalSaidas)],
            ['Saldo Médio', formatarMoeda(dados.totais.saldoMedio)],
            []
        ];
        const tableHeaders = ['Data', 'Saldo Inicial', 'Entradas', 'Saídas', 'Saldo Final', 'Fechado', 'Data Fechamento', 'Responsável'];
        const tableData = dados.diarios.map(d => [
            d.dataDiario ? moment(d.dataDiario).format('DD/MM/YYYY') : '-',
            d.saldoInicial,
            d.totalEntradas,
            d.totalSaidas,
            d.saldoFinal,
            d.fechado ? 'Sim' : 'Não',
            d.dataFechamento ? moment(d.dataFechamento).format('DD/MM/YYYY') : '-',
            d.responsavel || '-'
        ]);
        const ws = XLSX.utils.aoa_to_sheet([...headerData, tableHeaders, ...tableData]);
        XLSX.utils.book_append_sheet(wb, ws, 'Diários');
        XLSX.writeFile(wb, `Relatorio_Diarios_${moment().format('YYYYMMDD_HHmmss')}.xlsx`);
        message.success('Excel exportado!');
    };

    const columns = [
        { title: 'Data', dataIndex: 'dataDiario', render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-', width: 100 },
        { title: 'Saldo Inicial', dataIndex: 'saldoInicial', render: (v) => formatarMoeda(v), align: 'right', width: 130 },
        { title: 'Entradas', dataIndex: 'totalEntradas', render: (v) => formatarMoeda(v), align: 'right', width: 130 },
        { title: 'Saídas', dataIndex: 'totalSaidas', render: (v) => formatarMoeda(v), align: 'right', width: 130 },
        { title: 'Saldo Final', dataIndex: 'saldoFinal', render: (v) => formatarMoeda(v), align: 'right', width: 130 },
        { title: 'Fechado', dataIndex: 'fechado', render: (v) => v ? 'Sim' : 'Não', width: 80 },
        { title: 'Responsável', dataIndex: 'responsavel', width: 120 },
    ];

    return (
        <div>
            <Title level={3}>📖 Relatório de Diários</Title>
            <Text type="secondary">Movimentação diária do caixa</Text>
            <Divider />
            <Card size="small" style={{ marginBottom: 16 }}>
                <Form form={form} layout="inline" onFinish={handleGerar}>
                    <Form.Item name="periodo" label="Período" rules={[{ required: true }]}>
                        <RangePicker style={{ width: 300 }} />
                    </Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>Gerar</Button></Form.Item>
                </Form>
            </Card>
            {dados && (
                <>
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Space size="large">
                            <div><Text type="secondary">Total Dias:</Text><br /><Text strong>{dados.totais.totalDias}</Text></div>
                            <div><Text type="secondary">Total Entradas:</Text><br /><Text strong style={{ color: '#52c41a' }}>{formatarMoeda(dados.totais.totalEntradas)}</Text></div>
                            <div><Text type="secondary">Total Saídas:</Text><br /><Text strong style={{ color: '#ff4d4f' }}>{formatarMoeda(dados.totais.totalSaidas)}</Text></div>
                        </Space>
                    </Card>
                    <Space style={{ marginBottom: 16 }}>
                        <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>Exportar PDF</Button>
                        <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>Exportar Excel</Button>
                    </Space>
                    <Table columns={columns} dataSource={dados.diarios} rowKey="id" size="small" pagination={{ pageSize: 20 }} scroll={{ x: 900 }} />
                </>
            )}
        </div>
    );
};

export default RelatorioDiarios;
