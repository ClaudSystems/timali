// src/components/relatorios/RelatorioSaidas.jsx
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

const RelatorioSaidas = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState(null);

    const handleGerar = async (values) => {
        try {
            setLoading(true);
            const dataInicio = values.periodo[0].format('YYYY-MM-DD');
            const dataFim = values.periodo[1].format('YYYY-MM-DD');
            const resultado = await relatorioService.saidas(dataInicio, dataFim);
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
        doc.text('RELATÓRIO DE SAÍDAS/GASTOS', 148, 15, { align: 'center' });
        doc.setFontSize(10);
        const periodo = form.getFieldValue('periodo');
        if (periodo) doc.text(`Período: ${periodo[0].format('DD/MM/YYYY')} a ${periodo[1].format('DD/MM/YYYY')}`, 14, 25);
        doc.setFontSize(11);
        doc.text(`Total Saídas: ${dados.totais.totalSaidas} | Valor Total: ${formatarMoeda(dados.totais.valorTotalGasto)}`, 14, 35);
        
        const tableData = dados.saidas.map(s => [
            s.dataSaida ? moment(s.dataSaida).format('DD/MM/YYYY') : '-',
            s.descricao || '-',
            s.categoria || '-',
            formatarMoeda(s.valor),
            s.responsavel || '-'
        ]);
        
        doc.autoTable({
            startY: 45,
            head: [['Data', 'Descrição', 'Categoria', 'Valor', 'Responsável']],
            body: tableData,
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [255, 77, 79], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });
        doc.save(`Relatorio_Saidas_${moment().format('YYYYMMDD_HHmmss')}.pdf`);
        message.success('PDF exportado!');
    };

    const handleExportExcel = () => {
        if (!dados) return;
        const wb = XLSX.utils.book_new();
        const headerData = [
            ['RELATÓRIO DE SAÍDAS/GASTOS'],
            [`Período: ${form.getFieldValue('periodo')?.[0].format('DD/MM/YYYY')} a ${form.getFieldValue('periodo')?.[1].format('DD/MM/YYYY')}`],
            [],
            ['RESUMO'],
            ['Total Saídas', dados.totais.totalSaidas],
            ['Valor Total Gasto', formatarMoeda(dados.totais.valorTotalGasto)],
            []
        ];
        const tableHeaders = ['Data', 'Descrição', 'Categoria', 'Valor', 'Responsável', 'Comprovativo'];
        const tableData = dados.saidas.map(s => [
            s.dataSaida ? moment(s.dataSaida).format('DD/MM/YYYY') : '-',
            s.descricao || '-',
            s.categoria || '-',
            s.valor,
            s.responsavel || '-',
            s.comprovativo || '-'
        ]);
        const ws = XLSX.utils.aoa_to_sheet([...headerData, tableHeaders, ...tableData]);
        XLSX.utils.book_append_sheet(wb, ws, 'Saídas');
        XLSX.writeFile(wb, `Relatorio_Saidas_${moment().format('YYYYMMDD_HHmmss')}.xlsx`);
        message.success('Excel exportado!');
    };

    const columns = [
        { title: 'Data', dataIndex: 'dataSaida', render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-', width: 100 },
        { title: 'Descrição', dataIndex: 'descricao' },
        { title: 'Categoria', dataIndex: 'categoria', width: 120 },
        { title: 'Valor', dataIndex: 'valor', render: (v) => formatarMoeda(v), align: 'right', width: 130 },
        { title: 'Responsável', dataIndex: 'responsavel', width: 120 },
    ];

    return (
        <div>
            <Title level={3}>💸 Relatório de Saídas/Gastos</Title>
            <Text type="secondary">Gastos e saídas do caixa em um período</Text>
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
                            <div><Text type="secondary">Total Saídas:</Text><br /><Text strong>{dados.totais.totalSaidas}</Text></div>
                            <div><Text type="secondary">Valor Total Gasto:</Text><br /><Text strong style={{ color: '#ff4d4f' }}>{formatarMoeda(dados.totais.valorTotalGasto)}</Text></div>
                        </Space>
                    </Card>
                    <Space style={{ marginBottom: 16 }}>
                        <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>Exportar PDF</Button>
                        <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>Exportar Excel</Button>
                    </Space>
                    <Table columns={columns} dataSource={dados.saidas} rowKey="id" size="small" pagination={{ pageSize: 20 }} scroll={{ x: 700 }} />
                </>
            )}
        </div>
    );
};

export default RelatorioSaidas;
