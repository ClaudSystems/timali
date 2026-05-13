// src/components/relatorios/RelatorioPrestacoes.jsx
import React, { useState } from 'react';
import { Card, Form, DatePicker, Button, Table, Typography, Divider, Space, message, Tag } from 'antd';
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

const RelatorioPrestacoes = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState(null);

    const handleGerar = async (values) => {
        try {
            setLoading(true);
            const dataInicio = values.periodo[0].format('YYYY-MM-DD');
            const dataFim = values.periodo[1].format('YYYY-MM-DD');

            const resultado = await relatorioService.prestacoesPorVencimento(dataInicio, dataFim);
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
        doc.text('RELATÓRIO DE PRESTAÇÕES POR VENCIMENTO', 148, 15, { align: 'center' });
        
        doc.setFontSize(10);
        const periodo = form.getFieldValue('periodo');
        if (periodo) {
            doc.text(`Período: ${periodo[0].format('DD/MM/YYYY')} a ${periodo[1].format('DD/MM/YYYY')}`, 14, 25);
        }
        
        doc.setFontSize(11);
        doc.text(`Total: ${dados.totais.totalParcelas} | Pagas: ${dados.totais.parcelasPagas} | Pendentes: ${dados.totais.parcelasPendentes} | Em Mora: ${dados.totais.parcelasEmMora}`, 14, 35);
        
        const tableData = dados.parcelas.map(p => [
            p.numero,
            p.dataVencimento ? moment(p.dataVencimento).format('DD/MM/YYYY') : '-',
            p.creditoNumero || '-',
            p.clienteNome || '-',
            formatarMoeda(p.valorParcela),
            p.valorPago > 0 ? formatarMoeda(p.valorPago) : '-',
            p.pago ? 'Pago' : (p.emMora ? 'Em Mora' : 'Pendente'),
            p.diasAtraso > 0 ? `${p.diasAtraso} dias` : '-'
        ]);
        
        doc.autoTable({
            startY: 45,
            head: [['Nº', 'Vencimento', 'Crédito', 'Cliente', 'Valor', 'Pago', 'Status', 'Atraso']],
            body: tableData,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [24, 144, 255], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });
        
        doc.save(`Relatorio_Prestacoes_${moment().format('YYYYMMDD_HHmmss')}.pdf`);
        message.success('PDF exportado!');
    };

    const handleExportExcel = () => {
        if (!dados) return;
        
        const wb = XLSX.utils.book_new();
        
        const headerData = [
            ['RELATÓRIO DE PRESTAÇÕES POR VENCIMENTO'],
            [`Período: ${form.getFieldValue('periodo')?.[0].format('DD/MM/YYYY')} a ${form.getFieldValue('periodo')?.[1].format('DD/MM/YYYY')}`],
            [],
            ['RESUMO'],
            ['Total Parcelas', dados.totais.totalParcelas],
            ['Pagas', dados.totais.parcelasPagas],
            ['Pendentes', dados.totais.parcelasPendentes],
            ['Em Mora', dados.totais.parcelasEmMora],
            ['Valor Total', formatarMoeda(dados.totais.valorTotalParcelas)],
            ['Valor Pago', formatarMoeda(dados.totais.valorTotalPago)],
            []
        ];
        
        const tableHeaders = ['Nº Parcela', 'Vencimento', 'Crédito', 'Cliente', 'Valor', 'Pago', 'Status', 'Dias Atraso'];
        const tableData = dados.parcelas.map(p => [
            p.numero,
            p.dataVencimento ? moment(p.dataVencimento).format('DD/MM/YYYY') : '-',
            p.creditoNumero || '-',
            p.clienteNome || '-',
            p.valorParcela,
            p.valorPago || 0,
            p.pago ? 'Pago' : (p.emMora ? 'Em Mora' : 'Pendente'),
            p.diasAtraso || 0
        ]);
        
        const ws = XLSX.utils.aoa_to_sheet([...headerData, tableHeaders, ...tableData]);
        XLSX.utils.book_append_sheet(wb, ws, 'Prestações');
        
        const fileName = `Relatorio_Prestacoes_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        message.success('Excel exportado!');
    };

    const columns = [
        { title: 'Nº Parcela', dataIndex: 'numero', key: 'numero', width: 80 },
        { 
            title: 'Vencimento', 
            dataIndex: 'dataVencimento',
            render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-',
            width: 100
        },
        { title: 'Crédito', dataIndex: 'creditoNumero', key: 'creditoNumero', width: 120 },
        { title: 'Cliente', dataIndex: 'clienteNome', key: 'clienteNome' },
        { 
            title: 'Valor', 
            dataIndex: 'valorParcela',
            render: (v) => formatarMoeda(v),
            align: 'right',
            width: 120
        },
        { 
            title: 'Pago', 
            dataIndex: 'valorPago',
            render: (v) => v > 0 ? formatarMoeda(v) : '-',
            align: 'right',
            width: 120
        },
        { 
            title: 'Status', 
            dataIndex: 'pago',
            render: (pago, record) => {
                if (pago) return <Tag color="green">Pago</Tag>;
                if (record.emMora) return <Tag color="red">Em Mora</Tag>;
                return <Tag color="blue">Pendente</Tag>;
            },
            width: 100
        },
        { 
            title: 'Dias Atraso', 
            dataIndex: 'diasAtraso',
            render: (dias) => dias > 0 ? `${dias} dias` : '-',
            width: 100
        },
    ];

    return (
        <div>
            <Title level={3}>⏰ Relatório de Prestações por Vencimento</Title>
            <Text type="secondary">Prestações agrupadas por intervalo de vencimento</Text>
            <Divider />

            <Card size="small" style={{ marginBottom: 16 }}>
                <Form form={form} layout="inline" onFinish={handleGerar}>
                    <Form.Item name="periodo" label="Período de Vencimento" rules={[{ required: true }]}>
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
                            <div>
                                <Text type="secondary">Total Parcelas:</Text><br />
                                <Text strong>{dados.totais.totalParcelas}</Text>
                            </div>
                            <div>
                                <Text type="secondary">Pagas:</Text><br />
                                <Text strong style={{ color: '#52c41a' }}>{dados.totais.parcelasPagas}</Text>
                            </div>
                            <div>
                                <Text type="secondary">Pendentes:</Text><br />
                                <Text strong style={{ color: '#faad14' }}>{dados.totais.parcelasPendentes}</Text>
                            </div>
                            <div>
                                <Text type="secondary">Em Mora:</Text><br />
                                <Text strong style={{ color: '#ff4d4f' }}>{dados.totais.parcelasEmMora}</Text>
                            </div>
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

                    <Table
                        columns={columns}
                        dataSource={dados.parcelas}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 20 }}
                        scroll={{ x: 900 }}
                    />
                </>
            )}
        </div>
    );
};

export default RelatorioPrestacoes;
