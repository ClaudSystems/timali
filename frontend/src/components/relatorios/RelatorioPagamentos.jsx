// src/components/relatorios/RelatorioPagamentos.jsx
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

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency', currency: 'MZN', minimumFractionDigits: 2
    }).format(valor || 0);
};

const RelatorioPagamentos = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState(null);

    const handleGerar = async (values) => {
        try {
            setLoading(true);
            const dataInicio = values.periodo[0].format('YYYY-MM-DD');
            const dataFim = values.periodo[1].format('YYYY-MM-DD');
            const resultado = await relatorioService.pagamentosRecebidos(dataInicio, dataFim);
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
        doc.text('RELATÓRIO DE PAGAMENTOS RECEBIDOS', 148, 15, { align: 'center' });
        
        doc.setFontSize(10);
        const periodo = form.getFieldValue('periodo');
        if (periodo) {
            doc.text(`Período: ${periodo[0].format('DD/MM/YYYY')} a ${periodo[1].format('DD/MM/YYYY')}`, 14, 25);
        }
        
        doc.setFontSize(11);
        doc.text(`Total: ${dados.totais.totalPagamentos} pagamentos | Recebido: ${formatarMoeda(dados.totais.valorTotalRecebido)} | Média: ${formatarMoeda(dados.totais.mediaPorPagamento)}`, 14, 35);
        
        const tableData = dados.pagamentos.map(p => [
            p.dataPagamento ? moment(p.dataPagamento).format('DD/MM/YYYY') : '-',
            p.creditoNumero || '-',
            p.clienteNome || '-',
            `Parcela ${p.numeroParcela}`,
            formatarMoeda(p.valorPago),
            p.formaPagamento || '-',
            p.gestor || '-'
        ]);
        
        doc.autoTable({
            startY: 45,
            head: [['Data', 'Crédito', 'Cliente', 'Parcela', 'Valor Pago', 'Forma Pagto', 'Gestor']],
            body: tableData,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [82, 196, 26], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });
        
        doc.save(`Relatorio_Pagamentos_${moment().format('YYYYMMDD_HHmmss')}.pdf`);
        message.success('PDF exportado!');
    };

    const handleExportExcel = () => {
        if (!dados) return;
        
        const wb = XLSX.utils.book_new();
        
        const headerData = [
            ['RELATÓRIO DE PAGAMENTOS RECEBIDOS'],
            [`Período: ${form.getFieldValue('periodo')?.[0].format('DD/MM/YYYY')} a ${form.getFieldValue('periodo')?.[1].format('DD/MM/YYYY')}`],
            [],
            ['RESUMO'],
            ['Total Pagamentos', dados.totais.totalPagamentos],
            ['Valor Total Recebido', formatarMoeda(dados.totais.valorTotalRecebido)],
            ['Média por Pagamento', formatarMoeda(dados.totais.mediaPorPagamento)],
            []
        ];
        
        const tableHeaders = ['Data Pagamento', 'Crédito', 'Cliente', 'Nº Parcela', 'Valor Pago', 'Forma Pagamento', 'Comprovativo', 'Gestor'];
        const tableData = dados.pagamentos.map(p => [
            p.dataPagamento ? moment(p.dataPagamento).format('DD/MM/YYYY') : '-',
            p.creditoNumero || '-',
            p.clienteNome || '-',
            p.numeroParcela,
            p.valorPago,
            p.formaPagamento || '-',
            p.comprovativo || '-',
            p.gestor || '-'
        ]);
        
        const ws = XLSX.utils.aoa_to_sheet([...headerData, tableHeaders, ...tableData]);
        XLSX.utils.book_append_sheet(wb, ws, 'Pagamentos');
        
        const fileName = `Relatorio_Pagamentos_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        message.success('Excel exportado!');
    };

    const columns = [
        { title: 'Data Pagamento', dataIndex: 'dataPagamento', render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-', width: 110 },
        { title: 'Crédito', dataIndex: 'creditoNumero', width: 120 },
        { title: 'Cliente', dataIndex: 'clienteNome' },
        { title: 'Parcela Nº', dataIndex: 'numeroParcela', width: 90 },
        { title: 'Valor Pago', dataIndex: 'valorPago', render: (v) => formatarMoeda(v), align: 'right', width: 130 },
        { title: 'Forma Pagto', dataIndex: 'formaPagamento', width: 120 },
        { title: 'Gestor', dataIndex: 'gestor', width: 120 },
    ];

    return (
        <div>
            <Title level={3}>💰 Relatório de Pagamentos Recebidos</Title>
            <Text type="secondary">Pagamentos recebidos em um período específico</Text>
            <Divider />

            <Card size="small" style={{ marginBottom: 16 }}>
                <Form form={form} layout="inline" onFinish={handleGerar}>
                    <Form.Item name="periodo" label="Período" rules={[{ required: true }]}>
                        <RangePicker style={{ width: 300 }} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
                            Gerar
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {dados && (
                <>
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Space size="large">
                            <div><Text type="secondary">Total Pagamentos:</Text><br /><Text strong>{dados.totais.totalPagamentos}</Text></div>
                            <div><Text type="secondary">Valor Recebido:</Text><br /><Text strong style={{ color: '#52c41a' }}>{formatarMoeda(dados.totais.valorTotalRecebido)}</Text></div>
                            <div><Text type="secondary">Média/Pagto:</Text><br /><Text strong>{formatarMoeda(dados.totais.mediaPorPagamento)}</Text></div>
                        </Space>
                    </Card>

                    <Space style={{ marginBottom: 16 }}>
                        <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>
                            Exportar PDF
                        </Button>
                        <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
                            Exportar Excel
                        </Button>
                    </Space>
                    <Table columns={columns} dataSource={dados.pagamentos} rowKey="id" size="small" pagination={{ pageSize: 20 }} scroll={{ x: 900 }} />
                </>
            )}
        </div>
    );
};

export default RelatorioPagamentos;
