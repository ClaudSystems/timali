// src/components/credito/CreditoDetails.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Spin,
  Alert,
  Button,
  Table,
  Descriptions,
  Tag,
  Row,
  Col,
  Statistic,
  Divider,
  Space
} from 'antd';
import {
  ArrowLeftOutlined,
  DollarOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import creditoService from '../../services/creditoService';
import moment from 'moment';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CreditoDetails = ({ id }) => {
  const navigate = useNavigate();
  const [credito, setCredito] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) carregarCredito();
  }, [id]);

  const carregarCredito = async () => {
    setLoading(true);
    try {
      const data = await creditoService.buscar(id);
      console.log('=== DADOS BRUTOS ===', data);

      // Função para converter qualquer valor em string segura
      const toSafeString = (valor) => {
        if (valor === null || valor === undefined) return '-';
        if (typeof valor === 'string') return valor;
        if (typeof valor === 'number') return String(valor);
        if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
        if (typeof valor === 'object') {
          if (Array.isArray(valor)) {
            return valor.map(item => {
              if (typeof item === 'object' && item !== null) {
                return item.name || item.descricao || item.numero || item.id || JSON.stringify(item);
              }
              return String(item);
            }).join(', ');
          }
          if (valor.name) return String(valor.name);
          if (valor.descricao) return String(valor.descricao);
          if (valor.id && Object.keys(valor).length === 1) return `ID: ${valor.id}`;
          return '-';
        }
        return String(valor);
      };

      // Processar dados principais
      const processado = {
        id: data.id,
        numero: toSafeString(data.numero),
        valorConcedido: data.valorConcedido || 0,
        valorTotal: data.valorTotal || 0,
        totalPago: data.totalPago || 0,
        totalEmDivida: data.totalEmDivida || 0,
        totalJurosPago: data.totalJurosPago || 0,
        totalMultaPago: data.totalMultaPago || 0,
        percentualDeJuros: data.percentualDeJuros || 0,
        percentualJurosDeDemora: data.percentualJurosDeDemora || 0,
        numeroDePrestacoes: data.numeroDePrestacoes || 0,
        periodicidade: toSafeString(data.periodicidade),
        formaDeCalculo: toSafeString(data.formaDeCalculo),
        status: toSafeString(data.status, 'ATIVO'),
        dataEmissao: data.dataEmissao,
        dataValidade: data.dataValidade,
        quitado: data.quitado || false,
        emMora: data.emMora || false,
        ativo: data.ativo !== false,
        descricao: toSafeString(data.descricao),
        criadoPor: toSafeString(data.criadoPor, 'Sistema'),
        entidadeNome: data.entidade?.nome ? toSafeString(data.entidade.nome) : (data.entidade?.id ? `Cliente #${data.entidade.id}` : 'N/A'),
        entidadeCodigo: data.entidade?.codigo ? toSafeString(data.entidade.codigo) : '',
        definicaoNome: data.definicaoCredito?.nome ? toSafeString(data.definicaoCredito.nome) : 'Personalizada',
      };

      // Processar parcelas
      processado.parcelas = Array.isArray(data.parcelas) ? data.parcelas.map(p => ({
        id: p.id,
        numero: p.numero || '-',
        dataVencimento: p.dataVencimento,
        valorParcela: p.valorParcela || 0,
        valorAmortizacao: p.valorAmortizacao || 0,
        valorJuros: p.valorJuros || 0,
        valorPago: p.valorPago || 0,
        saldoDevedor: p.saldoDevedor || 0,
        status: toSafeString(p.status, 'PENDENTE'),
        diasAtraso: p.diasAtraso || 0,
        pago: p.pago || false
      })) : [];

      console.log('=== DADOS PROCESSADOS ===', processado);
      setCredito(processado);
    } catch (err) {
      console.error('Erro ao carregar crédito:', err);
      setError(err.message || 'Erro ao carregar detalhes do crédito');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FUNÇÃO PARA GERAR PDF DO PLANO DE PAGAMENTO
  // ============================================================
  const gerarPlanoPagamentoPDF = () => {
    if (!credito) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    // ----------------------------------------------------------
    // CABEÇALHO - TÍTULO
    // ----------------------------------------------------------
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PLANO DE PAGAMENTO', pageWidth / 2, y + 10, { align: 'center' });
    y += 18;

    // Linha separadora
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ----------------------------------------------------------
    // DADOS DO CLIENTE
    // ----------------------------------------------------------
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE', margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const clienteLinhas = [
      `CÓDIGO DO CLIENTE: ${credito.entidadeCodigo || 'N/A'}`,
      `Nome: ${credito.entidadeNome || 'N/A'}`,
      `Operador: ${credito.criadoPor || 'N/A'}`,
    ];

    clienteLinhas.forEach(linha => {
      doc.text(linha, margin, y);
      y += 5;
    });
    y += 3;

    // ----------------------------------------------------------
    // DADOS DO CRÉDITO
    // ----------------------------------------------------------
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CRÉDITO', margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const creditoDados = [
      { label: 'Data da Concessão:', value: credito.dataEmissao ? moment(credito.dataEmissao).format('DD/MM/YYYY') : '-' },
      { label: 'Crédito Nº:', value: credito.numero || '-' },
      { label: 'Periodicidade:', value: credito.periodicidade || '-' },
      { label: 'Juros:', value: `${credito.percentualDeJuros || 0}%` },
      { label: 'Juros de Mora:', value: `${credito.percentualJurosDeDemora || 0}%` },
      { label: 'Forma de Cálculo:', value: credito.formaDeCalculo || '-' },
    ];

    // Coluna 1
    let x1 = margin;
    creditoDados.slice(0, 3).forEach(info => {
      doc.setFont('helvetica', 'bold');
      doc.text(info.label, x1, y);
      doc.setFont('helvetica', 'normal');
      doc.text(info.value, x1 + 38, y);
      y += 5;
    });

    // Coluna 2
    let x2 = pageWidth / 2;
    y = margin + 38 + 3 + 7 + 3;  // reposicionar para paralelo com dados do crédito
    creditoDados.slice(3, 6).forEach(info => {
      doc.setFont('helvetica', 'bold');
      doc.text(info.label, x2, y);
      doc.setFont('helvetica', 'normal');
      doc.text(info.value, x2 + 30, y);
      y += 5;
    });

    // Valor Creditado - DESTACADO
    y = Math.max(y, margin + 38 + 3 + 7 + 3 + 25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const valorFormatado = new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(credito.valorConcedido || 0);
    doc.text(`VALOR CREDITADO: ${valorFormatado}`, margin, y);
    y += 10;

    // ----------------------------------------------------------
    // TABELA DE PARCELAS
    // ----------------------------------------------------------
    if (credito.parcelas && credito.parcelas.length > 0) {
      const totalPrestacao = credito.parcelas.reduce((sum, p) => sum + (p.valorParcela || 0), 0);
      const totalAmortizacao = credito.parcelas.reduce((sum, p) => sum + (p.valorAmortizacao || 0), 0);
      const totalJuros = credito.parcelas.reduce((sum, p) => sum + (p.valorJuros || 0), 0);

      const rows = credito.parcelas.map(p => [
        p.numero || '-',
        `${p.numero}ª Parcela`,
        p.dataVencimento ? moment(p.dataVencimento).format('DD/MM/YY') : '-',
        new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(p.valorParcela || 0),
        new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(p.valorAmortizacao || 0),
        new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(p.valorJuros || 0),
        new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(p.saldoDevedor || 0),
        p.status || 'PENDENTE',
      ]);

      doc.autoTable({
        startY: y,
        head: [[
          'Nº', 'Descrição', 'Data Venc.', 'V. Prestação',
          'V. Amortização', 'V. Juros', 'Saldo Devedor', 'Status'
        ]],
        body: rows,
        foot: [[
          '', '',
          { content: 'TOTAIS:', styles: { fontStyle: 'bold', halign: 'right' } },
          { content: new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(totalPrestacao), styles: { fontStyle: 'bold' } },
          { content: new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(totalAmortizacao), styles: { fontStyle: 'bold' } },
          { content: new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(totalJuros), styles: { fontStyle: 'bold' } },
          '', ''
        ]],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [149, 185, 199], textColor: 0, fontStyle: 'bold' },
        footStyles: { fillColor: [240, 240, 240], textColor: 0 },
        margin: { left: margin, right: margin },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
        },
      });

      y = doc.lastAutoTable.finalY + 12;
    }

    // ----------------------------------------------------------
    // ASSINATURAS
    // ----------------------------------------------------------
    if (y > 160) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSINATURAS', margin, y);
    y += 8;

    const colWidth = (pageWidth - margin * 2) / 2;

    doc.setFont('helvetica', 'normal');
    doc.text('CLIENTE', margin, y);
    doc.text('GERENTE', margin + colWidth, y);
    y += 5;

    doc.line(margin, y, margin + colWidth - 10, y);
    doc.line(margin + colWidth, y, pageWidth - margin, y);
    y += 8;

    doc.text('GESTOR DE CRÉDITO', margin, y);
    y += 5;
    doc.line(margin, y, margin + colWidth - 10, y);
    y += 15;

    // ----------------------------------------------------------
    // RODAPÉ - INFORMAÇÕES BANCÁRIAS
    // ----------------------------------------------------------
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'O cliente poderá efetuar o pagamento nos nossos balcões ou depositar nas seguintes contas:',
      margin, y
    );
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.text('BCI: 1234567890 | BIM: 0987654321 | MPESA: 859876543', margin, y);

    // ----------------------------------------------------------
    // SALVAR O PDF
    // ----------------------------------------------------------
    const fileName = `Plano_Pagamento_${credito.numero || 'Credito'}.pdf`;
    doc.save(fileName);
  };

  if (loading) return <Spin size="large" style={{ margin: '50px', display: 'block' }} />;
  if (error) return <Alert message="Erro" description={error} type="error" showIcon />;
  if (!credito) return <Alert message="Crédito não encontrado" type="warning" showIcon />;

  const formatarMoeda = (v) => {
    if (!v && v !== 0) return 'MT 0,00';
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(v);
  };

  const statusMap = {
    'ATIVO': { color: 'green', text: 'Ativo' },
    'EM_ATRASO': { color: 'red', text: 'Em Atraso' },
    'QUITADO': { color: 'blue', text: 'Quitado' },
    'CANCELADO': { color: 'orange', text: 'Cancelado' },
  };
  const st = statusMap[credito.status] || { color: 'default', text: credito.status };

  const progresso = credito.valorTotal > 0
    ? Math.min((credito.totalPago / credito.valorTotal) * 100, 100).toFixed(2)
    : 0;

  const colunasParcelas = [
    { title: 'Nº', dataIndex: 'numero', width: 50 },
    { title: 'Vencimento', dataIndex: 'dataVencimento', width: 110,
      render: v => v ? moment(v).format('DD/MM/YYYY') : '-' },
    { title: 'Valor', dataIndex: 'valorParcela', width: 120,
      render: v => formatarMoeda(v) },
    { title: 'Amortização', dataIndex: 'valorAmortizacao', width: 120,
      render: v => formatarMoeda(v) },
    { title: 'Juros', dataIndex: 'valorJuros', width: 100,
      render: v => formatarMoeda(v) },
    { title: 'Pago', dataIndex: 'valorPago', width: 120,
      render: v => <span style={{ color: '#52c41a' }}>{formatarMoeda(v)}</span> },
    { title: 'Saldo', dataIndex: 'saldoDevedor', width: 120,
      render: v => formatarMoeda(v) },
    {
      title: 'Status', dataIndex: 'status', width: 100,
      render: s => {
        const cmap = { 'PAGA': 'green', 'PENDENTE': 'orange', 'VENCIDA': 'red' };
        return <Tag color={cmap[s] || 'default'}>{s}</Tag>;
      }
    },
    { title: 'Atraso', dataIndex: 'diasAtraso', width: 80,
      render: v => v > 0 ? <Tag color="error">{v}d</Tag> : '-' },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Card
        title={
          <Space>
            <span>Crédito #{credito.numero}</span>
            <Tag color={st.color}>{st.text}</Tag>
          </Space>
        }
        extra={
          <Space>
            {/* BOTÃO DE PDF - IMPRIMIR PLANO */}
            <Button
              icon={<FilePdfOutlined />}
              onClick={gerarPlanoPagamentoPDF}
            >
              Imprimir Plano
            </Button>
            <Button
              icon={<DollarOutlined />}
              onClick={() => navigate(`/creditos/${id}/parcelas`)}
              type="primary"
            >
              Parcelas
            </Button>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/creditos')}
            >
              Voltar
            </Button>
          </Space>
        }
      >
        {/* Indicadores principais */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="Valor Concedido" value={formatarMoeda(credito.valorConcedido)} />
          </Col>
          <Col span={6}>
            <Statistic title="Valor Total" value={formatarMoeda(credito.valorTotal)} />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Pago"
              value={formatarMoeda(credito.totalPago)}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Saldo Devedor"
              value={formatarMoeda(Math.abs(credito.totalEmDivida))}
              valueStyle={{ color: credito.totalEmDivida > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Col>
        </Row>

        {/* Barra de progresso */}
        <div style={{ marginBottom: 24 }}>
          <span>Progresso: {progresso}%</span>
          <div style={{
            width: '100%',
            height: 20,
            backgroundColor: '#f0f0f0',
            borderRadius: 10,
            overflow: 'hidden',
            marginTop: 4
          }}>
            <div style={{
              width: `${progresso}%`,
              height: '100%',
              backgroundColor: progresso >= 100 ? '#52c41a' : '#1890ff'
            }} />
          </div>
        </div>

        <Divider>Informações do Crédito</Divider>

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Entidade" span={2}>
            <strong>{credito.entidadeNome}</strong>
            {credito.entidadeCodigo && ` (${credito.entidadeCodigo})`}
          </Descriptions.Item>
          <Descriptions.Item label="Definição">{credito.definicaoNome}</Descriptions.Item>
          <Descriptions.Item label="Criado por">{credito.criadoPor}</Descriptions.Item>
          <Descriptions.Item label="Nº Prestações">{credito.numeroDePrestacoes}</Descriptions.Item>
          <Descriptions.Item label="Periodicidade">{credito.periodicidade}</Descriptions.Item>
          <Descriptions.Item label="Taxa de Juros">{credito.percentualDeJuros}%</Descriptions.Item>
          <Descriptions.Item label="Juros de Demora">{credito.percentualJurosDeDemora}%</Descriptions.Item>
          <Descriptions.Item label="Forma de Cálculo">{credito.formaDeCalculo}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={st.color}>{st.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Data Emissão">
            {credito.dataEmissao ? moment(credito.dataEmissao).format('DD/MM/YYYY') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Data Validade">
            {credito.dataValidade ? moment(credito.dataValidade).format('DD/MM/YYYY') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Quitado">
            {credito.quitado ? <Tag color="success">Sim</Tag> : 'Não'}
          </Descriptions.Item>
          <Descriptions.Item label="Em Mora">
            {credito.emMora ? <Tag color="error">Sim</Tag> : 'Não'}
          </Descriptions.Item>
        </Descriptions>

        {credito.parcelas.length > 0 && (
          <>
            <Divider>Parcelas</Divider>
            <Table
              dataSource={credito.parcelas}
              rowKey="id"
              columns={colunasParcelas}
              size="small"
              pagination={false}
              scroll={{ x: 900 }}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default CreditoDetails;