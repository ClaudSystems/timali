// src/components/relatorios/RelatorioClientesAtrasados.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Typography, Divider, Space, message, Tag, Progress } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, TeamOutlined } from '@ant-design/icons';
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

const RelatorioClientesAtrasados = () => {
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState(null);

    useEffect(() => {
        carregarRelatorio();
    }, []);

    const carregarRelatorio = async () => {
        try {
            setLoading(true);
            const resultado = await relatorioService.clientesComAtrasos();
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
        doc.text('RELATÓRIO DE CLIENTES COM ATRASOS', pw / 2, y, { align: 'center' });
        y += 8;

        doc.setFontSize(9).setFont('helvetica', 'normal');
        doc.text(`Data de Emissão: ${moment().format('DD/MM/YYYY HH:mm')}`, m, y);
        y += 10;

        const head = [['Código', 'Cliente', 'Telefone', 'Créditos em Mora', 'Total em Mora', 'Maior Atraso']];
        
        const body = dados.clientes.map(c => [
            c.clienteCodigo,
            c.clienteNome,
            c.clienteTelefone || '-',
            c.totalCreditosEmMora,
            formatarMoeda(c.totalEmMora),
            `${c.maiorAtraso} dias`
        ]);

        doc.autoTable({
            startY: y,
            head: head,
            body: body,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [250, 173, 20], textColor: 255, fontStyle: 'bold' },
            margin: { left: m, right: m },
        });

        y = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(10).setFont('helvetica', 'bold');
        doc.text('RESUMO', m, y);
        y += 6;
        doc.setFontSize(8);
        doc.text(`Total de Clientes em Atraso: ${dados.totais.totalClientesEmAtraso}`, m, y); y += 5;
        doc.text(`Valor Total em Mora: ${formatarMoeda(dados.totais.valorTotalEmMora)}`, m, y);

        doc.save(`Relatorio_Clientes_com_Atrasos_${moment().format('YYYYMMDD_HHmmss')}.pdf`);
        message.success('PDF exportado!');
    };

    const handleExportExcel = () => {
        if (!dados) return;

        const wb = XLSX.utils.book_new();

        const headerData = [
            ['RELATÓRIO DE CLIENTES COM ATRASOS'],
            ['Data de Emissão:', moment().format('DD/MM/YYYY HH:mm')],
            [],
        ];

        const tableHeaders = ['Código', 'Cliente', 'Telefone', 'Créditos em Mora', 'Total em Mora', 'Maior Atraso (dias)', 'Detalhes dos Créditos'];
        
        const tableData = dados.clientes.map(c => {
            const creditosDetalhe = c.creditos.map(cr => 
                `${cr.numero}: ${formatarMoeda(cr.totalEmMora)} (${cr.maiorAtraso} dias)`
            ).join('; ');
            
            return [
                c.clienteCodigo,
                c.clienteNome,
                c.clienteTelefone,
                c.totalCreditosEmMora,
                c.totalEmMora,
                c.maiorAtraso,
                creditosDetalhe
            ];
        });

        const totalsRow = [
            '', 'TOTAIS', '', 
            dados.totais.totalClientesEmAtraso,
            dados.totais.valorTotalEmMora,
            '', ''
        ];

        const ws = XLSX.utils.aoa_to_sheet([...headerData, tableHeaders, ...tableData, totalsRow]);
        XLSX.utils.book_append_sheet(wb, ws, 'Clientes Atrasados');
        
        const fileName = `Relatorio_Clientes_Atrasados_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        message.success('Excel exportado!');
    };

    const columns = [
        { title: 'Código', dataIndex: 'clienteCodigo', key: 'clienteCodigo', width: 100 },
        { 
            title: 'Cliente', 
            dataIndex: 'clienteNome', 
            key: 'clienteNome',
            ellipsis: true,
            render: (nome) => <Text strong>{nome}</Text>,
            width: 200
        },
        { title: 'Telefone', dataIndex: 'clienteTelefone', key: 'clienteTelefone', width: 120 },
        { 
            title: 'Créditos em Mora', 
            dataIndex: 'totalCreditosEmMora', 
            key: 'totalCreditosEmMora',
            render: (v) => <Tag color="red">{v}</Tag>,
            align: 'center',
            width: 120
        },
        { 
            title: 'Total em Mora', 
            dataIndex: 'totalEmMora', 
            key: 'totalEmMora',
            render: (v) => <Text strong style={{ color: '#ff4d4f', fontSize: 14 }}>{formatarMoeda(v)}</Text>,
            align: 'right',
            width: 140
        },
        { 
            title: 'Maior Atraso', 
            dataIndex: 'maiorAtraso', 
            key: 'maiorAtraso',
            render: (dias) => (
                <div>
                    <Tag color={dias > 90 ? 'red' : dias > 30 ? 'orange' : 'gold'}>
                        {dias} dias
                    </Tag>
                </div>
            ),
            align: 'center',
            width: 110
        },
    ];

    return (
        <div>
            <Title level={3}>👥 Relatório de Clientes com Atrasos</Title>
            <Text type="secondary">Clientes com créditos em mora ordenados por valor devido</Text>

            <Divider />

            <Card size="small" style={{ marginBottom: 16 }}>
                <Space>
                    <Button onClick={carregarRelatorio} loading={loading} icon={<TeamOutlined />}>
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
                                <Text type="secondary">Clientes em Atraso:</Text><br />
                                <Text strong style={{ fontSize: 18, color: '#faad14' }}>
                                    {dados.totais.totalClientesEmAtraso}
                                </Text>
                            </div>
                            <div>
                                <Text type="secondary">Valor Total em Mora:</Text><br />
                                <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                                    {formatarMoeda(dados.totais.valorTotalEmMora)}
                                </Text>
                            </div>
                        </Space>
                    </Card>

                    <Table
                        columns={columns}
                        dataSource={dados.clientes}
                        rowKey="clienteId"
                        size="small"
                        pagination={{ pageSize: 20, showTotal: total => `Total: ${total} clientes` }}
                        scroll={{ x: 900 }}
                    />
                </>
            )}
        </div>
    );
};

export default RelatorioClientesAtrasados;
