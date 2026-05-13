// src/components/relatorios/RelatorioCreditosEmMora.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Typography, Divider, Space, message, Tag, Alert } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, WarningOutlined } from '@ant-design/icons';
import relatorioService from '../../services/relatorioService';
import moment from 'moment';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Title, Text } = Typography;

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 2
    }).format(valor || 0);
};

const RelatorioCreditosEmMora = () => {
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState(null);

    useEffect(() => {
        carregarRelatorio();
    }, []);

    const carregarRelatorio = async () => {
        try {
            setLoading(true);
            const resultado = await relatorioService.creditosEmMora();
            setDados(resultado);
        } catch (error) {
            console.error('Erro ao carregar relatório:', error);
            message.error('Erro ao carregar relatório');
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

        doc.setFontSize(16).setFont('helvetica', 'bold');
        doc.text('RELATÓRIO DE CRÉDITOS EM MORA', pw / 2, y, { align: 'center' });
        y += 8;

        doc.setFontSize(9).setFont('helvetica', 'normal');
        doc.text(`Data de Emissão: ${moment().format('DD/MM/YYYY HH:mm')}`, m, y);
        y += 10;

        const head = [['Nº Crédito', 'Data', 'Cliente', 'Telefone', 'Valor Total', 'Total Pago', 'Saldo', 'Em Mora', 'Parcelas Atraso', 'Maior Atraso']];
        
        const body = dados.creditos.map(c => [
            c.numero,
            moment(c.dataEmissao).format('DD/MM/YY'),
            c.entidadeNome,
            c.entidadeTelefone || '-',
            formatarMoeda(c.valorTotal),
            formatarMoeda(c.totalPago),
            formatarMoeda(c.saldoDevedor),
            formatarMoeda(c.totalEmMora),
            c.parcelasEmAtraso,
            `${c.maiorAtraso} dias`
        ]);

        doc.autoTable({
            startY: y,
            head: head,
            body: body,
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [255, 77, 79], textColor: 255, fontStyle: 'bold' },
            margin: { left: m, right: m },
        });

        y = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(10).setFont('helvetica', 'bold');
        doc.text('RESUMO', m, y);
        y += 6;
        doc.setFontSize(8);
        doc.text(`Total de Créditos em Mora: ${dados.totais.totalCreditosEmMora}`, m, y); y += 5;
        doc.text(`Valor Total em Mora: ${formatarMoeda(dados.totais.valorTotalEmMora)}`, m, y); y += 5;
        doc.text(`Total de Parcelas em Atraso: ${dados.totais.totalParcelasEmAtraso}`, m, y);

        doc.save(`Relatorio_Creditos_em_Mora_${moment().format('YYYYMMDD_HHmmss')}.pdf`);
        message.success('PDF exportado!');
    };

    const handleExportExcel = () => {
        if (!dados) return;

        const wb = XLSX.utils.book_new();

        const headerData = [
            ['RELATÓRIO DE CRÉDITOS EM MORA'],
            ['Data de Emissão:', moment().format('DD/MM/YYYY HH:mm')],
            [],
        ];

        const tableHeaders = ['Nº Crédito', 'Data Emissão', 'Cliente', 'Código', 'Telefone', 'Valor Concedido', 'Valor Total', 'Total Pago', 'Saldo Devedor', 'Total em Mora', 'Parcelas Atraso', 'Maior Atraso (dias)', 'Gestor'];
        
        const tableData = dados.creditos.map(c => [
            c.numero,
            moment(c.dataEmissao).format('DD/MM/YYYY'),
            c.entidadeNome,
            c.entidadeCodigo,
            c.entidadeTelefone,
            c.valorConcedido,
            c.valorTotal,
            c.totalPago,
            c.saldoDevedor,
            c.totalEmMora,
            c.parcelasEmAtraso,
            c.maiorAtraso,
            c.gestor
        ]);

        const totalsRow = [
            '', '', 'TOTAIS', '', '', '', '', '', 
            dados.totais.valorTotalEmMora,
            dados.totais.totalParcelasEmAtraso,
            '', ''
        ];

        const ws = XLSX.utils.aoa_to_sheet([...headerData, tableHeaders, ...tableData, totalsRow]);
        XLSX.utils.book_append_sheet(wb, ws, 'Créditos em Mora');
        
        const fileName = `Relatorio_Creditos_em_Mora_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        message.success('Excel exportado!');
    };

    const columns = [
        { title: 'Nº Crédito', dataIndex: 'numero', key: 'numero', width: 120, fixed: 'left' },
        { 
            title: 'Data', 
            dataIndex: 'dataEmissao', 
            key: 'dataEmissao',
            render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-',
            width: 100
        },
        { title: 'Cliente', dataIndex: 'entidadeNome', key: 'entidadeNome', ellipsis: true, width: 200 },
        { title: 'Código', dataIndex: 'entidadeCodigo', key: 'entidadeCodigo', width: 100 },
        { title: 'Telefone', dataIndex: 'entidadeTelefone', key: 'entidadeTelefone', width: 120 },
        { 
            title: 'Valor Total', 
            dataIndex: 'valorTotal', 
            key: 'valorTotal',
            render: (v) => formatarMoeda(v),
            align: 'right',
            width: 120
        },
        { 
            title: 'Total Pago', 
            dataIndex: 'totalPago', 
            key: 'totalPago',
            render: (v) => formatarMoeda(v),
            align: 'right',
            width: 120
        },
        { 
            title: 'Saldo', 
            dataIndex: 'saldoDevedor', 
            key: 'saldoDevedor',
            render: (v) => formatarMoeda(v),
            align: 'right',
            width: 120
        },
        { 
            title: 'Em Mora', 
            dataIndex: 'totalEmMora', 
            key: 'totalEmMora',
            render: (v) => <Text strong style={{ color: '#ff4d4f' }}>{formatarMoeda(v)}</Text>,
            align: 'right',
            width: 120
        },
        { 
            title: 'Parc. Atraso', 
            dataIndex: 'parcelasEmAtraso', 
            key: 'parcelasEmAtraso',
            render: (v) => <Tag color="red">{v}</Tag>,
            align: 'center',
            width: 100
        },
        { 
            title: 'Maior Atraso', 
            dataIndex: 'maiorAtraso', 
            key: 'maiorAtraso',
            render: (v) => `${v} dias`,
            align: 'center',
            width: 100
        },
        { title: 'Gestor', dataIndex: 'gestor', key: 'gestor', width: 120 },
    ];

    return (
        <div>
            <Title level={3}>⚠️ Relatório de Créditos em Mora</Title>
            <Text type="secondary">Todos os créditos com pagamentos em atraso</Text>

            <Divider />

            {dados && dados.totais.totalCreditosEmMora > 0 && (
                <Alert
                    message={`Atenção: ${dados.totais.totalCreditosEmMora} crédito(s) em mora`}
                    description={`Valor total em mora: ${formatarMoeda(dados.totais.valorTotalEmMora)} | Total de parcelas em atraso: ${dados.totais.totalParcelasEmAtraso}`}
                    type="warning"
                    icon={<WarningOutlined />}
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            <Card size="small" style={{ marginBottom: 16 }}>
                <Space>
                    <Button onClick={carregarRelatorio} loading={loading}>
                        Atualizar
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
            </Card>

            {dados && (
                <>
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Space size="large">
                            <div>
                                <Text type="secondary">Créditos em Mora:</Text><br />
                                <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                                    {dados.totais.totalCreditosEmMora}
                                </Text>
                            </div>
                            <div>
                                <Text type="secondary">Valor Total em Mora:</Text><br />
                                <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                                    {formatarMoeda(dados.totais.valorTotalEmMora)}
                                </Text>
                            </div>
                            <div>
                                <Text type="secondary">Parcelas em Atraso:</Text><br />
                                <Text strong style={{ fontSize: 18, color: '#faad14' }}>
                                    {dados.totais.totalParcelasEmAtraso}
                                </Text>
                            </div>
                        </Space>
                    </Card>

                    <Table
                        columns={columns}
                        dataSource={dados.creditos}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 20, showTotal: total => `Total: ${total} créditos em mora` }}
                        scroll={{ x: 1500 }}
                    />
                </>
            )}
        </div>
    );
};

export default RelatorioCreditosEmMora;
