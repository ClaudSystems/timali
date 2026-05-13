// src/components/relatorios/RelatorioCreditosPorGestor.jsx
import React, { useState } from 'react';
import { Card, Form, DatePicker, Select, Button, Table, Typography, Divider, Space, message, Collapse, Tag } from 'antd';
import { SearchOutlined, FilePdfOutlined, FileExcelOutlined, UserOutlined } from '@ant-design/icons';
import relatorioService from '../../services/relatorioService';
import moment from 'moment';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency', currency: 'MZN', minimumFractionDigits: 2
    }).format(valor || 0);
};

const RelatorioCreditosPorGestor = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState(null);
    const [gestores, setGestores] = useState([]);
    const [carregandoGestores, setCarregandoGestores] = useState(false);

    // Carregar lista de gestores ao montar o componente
    React.useEffect(() => {
        const carregarGestores = async () => {
            try {
                setCarregandoGestores(true);
                const lista = await relatorioService.getGestores();
                setGestores(lista);
            } catch (error) {
                console.error('Erro ao carregar gestores:', error);
                message.error('Erro ao carregar lista de gestores');
            } finally {
                setCarregandoGestores(false);
            }
        };
        carregarGestores();
    }, []);

    const handleGerar = async (values) => {
        try {
            setLoading(true);
            const dataInicio = values.periodo[0].format('YYYY-MM-DD');
            const dataFim = values.periodo[1].format('YYYY-MM-DD');
            const gestor = values.gestor;

            const resultado = await relatorioService.creditosPorGestor(dataInicio, dataFim, gestor);
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
        
        // Título
        doc.setFontSize(16);
        doc.text('RELATÓRIO DE CRÉDITOS POR GESTOR', 148, 15, { align: 'center' });
        
        // Período
        doc.setFontSize(10);
        const periodo = form.getFieldValue('periodo');
        if (periodo) {
            doc.text(`Período: ${periodo[0].format('DD/MM/YYYY')} a ${periodo[1].format('DD/MM/YYYY')}`, 14, 25);
        }
        
        // Totais
        doc.setFontSize(11);
        doc.text(`Total de Gestores: ${dados.totais.totalGestores}`, 14, 35);
        doc.text(`Total de Créditos: ${dados.totais.totalCreditos}`, 80, 35);
        doc.text(`Valor Concedido: ${formatarMoeda(dados.totais.valorTotalConcedido)}`, 150, 35);
        
        let y = 45;
        
        // Para cada gestor
        dados.gestores.forEach((gestor, idx) => {
            if (y > 170) {
                doc.addPage();
                y = 20;
            }
            
            // Cabeçalho do gestor
            doc.setFontSize(12);
            doc.setTextColor(24, 144, 255);
            doc.text(`Gestor: ${gestor.gestor}`, 14, y);
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`(${gestor.totalCreditos} créditos - ${formatarMoeda(gestor.valorTotalConcedido)})`, 100, y);
            y += 8;
            
            // Tabela de créditos
            const tableData = gestor.creditos.map(c => [
                c.numero,
                c.dataEmissao ? moment(c.dataEmissao).format('DD/MM/YYYY') : '-',
                c.entidadeNome || '-',
                formatarMoeda(c.valorConcedido),
                formatarMoeda(c.valorTotal),
                formatarMoeda(c.totalPago)
            ]);
            
            doc.autoTable({
                startY: y,
                head: [['Nº Crédito', 'Data', 'Cliente', 'Valor Concedido', 'Valor Total', 'Pago']],
                body: tableData,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [24, 144, 255], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: 14, right: 14 }
            });
            
            y = doc.lastAutoTable.finalY + 10;
        });
        
        doc.save(`Relatorio_Creditos_por_Gestor_${moment().format('YYYYMMDD_HHmmss')}.pdf`);
        message.success('PDF exportado!');
    };

    const handleExportExcel = () => {
        if (!dados) return;
        
        const wb = XLSX.utils.book_new();
        
        // Dados gerais
        const headerData = [
            ['RELATÓRIO DE CRÉDITOS POR GESTOR'],
            [`Período: ${form.getFieldValue('periodo')?.[0].format('DD/MM/YYYY')} a ${form.getFieldValue('periodo')?.[1].format('DD/MM/YYYY')}`],
            [],
            ['RESUMO'],
            ['Total de Gestores', dados.totais.totalGestores],
            ['Total de Créditos', dados.totais.totalCreditos],
            ['Valor Total Concedido', formatarMoeda(dados.totais.valorTotalConcedido)],
            ['Valor Total a Pagar', formatarMoeda(dados.totais.valorTotalAPagar)],
            ['Valor Total Pago', formatarMoeda(dados.totais.valorTotalPago)],
            []
        ];
        
        // Dados por gestor
        const tableHeaders = ['Gestor', 'Nº Crédito', 'Data Emissão', 'Cliente', 'Valor Concedido', 'Valor Total', 'Total Pago'];
        const tableData = [];
        
        dados.gestores.forEach(gestor => {
            gestor.creditos.forEach(credito => {
                tableData.push([
                    gestor.gestor,
                    credito.numero,
                    credito.dataEmissao ? moment(credito.dataEmissao).format('DD/MM/YYYY') : '-',
                    credito.entidadeNome || '-',
                    credito.valorConcedido,
                    credito.valorTotal,
                    credito.totalPago
                ]);
            });
        });
        
        const ws = XLSX.utils.aoa_to_sheet([...headerData, tableHeaders, ...tableData]);
        XLSX.utils.book_append_sheet(wb, ws, 'Créditos por Gestor');
        
        const fileName = `Relatorio_Creditos_por_Gestor_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        message.success('Excel exportado!');
    };

    const columns = [
        { title: 'Nº Crédito', dataIndex: 'numero', key: 'numero', width: 120 },
        { 
            title: 'Data', 
            dataIndex: 'dataEmissao', 
            render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-',
            width: 100
        },
        { title: 'Cliente', dataIndex: 'entidadeNome', key: 'entidadeNome' },
        { 
            title: 'Valor Concedido', 
            dataIndex: 'valorConcedido',
            render: (v) => formatarMoeda(v),
            align: 'right',
            width: 130
        },
        { 
            title: 'Valor Total', 
            dataIndex: 'valorTotal',
            render: (v) => formatarMoeda(v),
            align: 'right',
            width: 130
        },
        { 
            title: 'Pago', 
            dataIndex: 'totalPago',
            render: (v) => formatarMoeda(v),
            align: 'right',
            width: 130
        },
    ];

    return (
        <div>
            <Title level={3}>👤 Relatório de Créditos por Gestor</Title>
            <Text type="secondary">Créditos agrupados por gestor/concessionário</Text>
            <Divider />

            <Card size="small" style={{ marginBottom: 16 }}>
                <Form form={form} layout="inline" onFinish={handleGerar}>
                    <Form.Item name="periodo" label="Período" rules={[{ required: true }]}>
                        <RangePicker style={{ width: 300 }} />
                    </Form.Item>
                    <Form.Item name="gestor" label="Gestor (opcional)">
                        <Select 
                            placeholder="Selecione um gestor" 
                            style={{ width: 250 }} 
                            allowClear
                            loading={carregandoGestores}
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {gestores.map(g => (
                                <Select.Option key={g.username} value={g.username} label={g.nome}>
                                    {g.nome}
                                </Select.Option>
                            ))}
                        </Select>
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
                                <Text type="secondary">Total de Gestores:</Text><br />
                                <Text strong>{dados.totais.totalGestores}</Text>
                            </div>
                            <div>
                                <Text type="secondary">Total de Créditos:</Text><br />
                                <Text strong>{dados.totais.totalCreditos}</Text>
                            </div>
                            <div>
                                <Text type="secondary">Valor Concedido:</Text><br />
                                <Text strong>{formatarMoeda(dados.totais.valorTotalConcedido)}</Text>
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

                    <Collapse>
                        {dados.gestores.map((gestor, idx) => (
                            <Panel 
                                header={
                                    <Space>
                                        <UserOutlined />
                                        <Text strong>{gestor.gestor}</Text>
                                        <Tag color="blue">{gestor.totalCreditos} créditos</Tag>
                                        <Text type="secondary">{formatarMoeda(gestor.valorTotalConcedido)}</Text>
                                    </Space>
                                } 
                                key={idx}
                            >
                                <Table
                                    columns={columns}
                                    dataSource={gestor.creditos}
                                    rowKey="id"
                                    size="small"
                                    pagination={false}
                                />
                            </Panel>
                        ))}
                    </Collapse>
                </>
            )}
        </div>
    );
};

export default RelatorioCreditosPorGestor;
