import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, Alert, Tag, Space } from 'antd';
import { ArrowLeftOutlined, DollarOutlined, FilePdfOutlined } from '@ant-design/icons';
import creditoService from '../../services/creditoService';
import moment from 'moment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CreditoShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [credito, setCredito] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) carregarCredito();
  }, [id]);

  const carregarCredito = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await creditoService.buscar(id);
      setCredito(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    const num = Number(valor) || 0;
    return num.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });
  };

  const getStatusTag = (status) => {
    const s = String(status || '');
    const map = {
      'ATIVO': 'green', 'Ativo': 'green',
      'EM_ATRASO': 'red', 'QUITADO': 'blue',
      'CANCELADO': 'orange', 'RASCUNHO': 'default', 'RENEGOCIADO': 'purple'
    };
    return <Tag color={map[s] || 'default'}>{s || 'N/A'}</Tag>;
  };

  const gerarPlanoPagamentoPDF = async () => {
    if (!credito) return;

    try {
      const parcelas = await creditoService.listarParcelas(id);
      if (!parcelas || parcelas.length === 0) {
        alert('Este credito nao possui parcelas!');
        return;
      }
      parcelas.sort((a, b) => (a.numero || 0) - (b.numero || 0));

      const fmt = (v) => {
        const n = Number(v) || 0;
        return n.toFixed(2).replace('.', ',') + ' MTn';
      };

      const body = parcelas.map(p => {
        let d = '-';
        if (p.dataVencimento) {
          try {
            const m = moment(p.dataVencimento);
            d = m.isValid() ? m.format('DD/MM/YY') : String(p.dataVencimento).substring(0, 10);
          } catch (e) {
            d = String(p.dataVencimento).substring(0, 10);
          }
        }
        return [
          String(p.numero || ''),
          String(p.numero || '') + 'a',
          String(d),
          String(fmt(p.valorParcela)),
          String(fmt(p.valorAmortizacao)),
          String(fmt(p.valorJuros)),
          String(fmt(p.saldoDevedor)),
          String(p.status || 'Pendente'),
        ];
      });

      const tp = parcelas.reduce((s, p) => s + (Number(p.valorParcela) || 0), 0);
      const ta = parcelas.reduce((s, p) => s + (Number(p.valorAmortizacao) || 0), 0);
      const tj = parcelas.reduce((s, p) => s + (Number(p.valorJuros) || 0), 0);

      const head = ['N', 'Desc', 'Vencimento', 'Prestacao', 'Amortizacao', 'Juros', 'Saldo Dev.', 'Status'];
      const foot = ['', '', 'TOTAIS', fmt(tp), fmt(ta), fmt(tj), '', ''];

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = doc.internal.pageSize.getWidth();
      const m = 12;
      let y = m;

      // Titulo
      doc.setFontSize(14).setFont('helvetica', 'bold');
      doc.text('PLANO DE PAGAMENTO', pw / 2, y + 5, { align: 'center' });
      y += 14;
      doc.setDrawColor(0).setLineWidth(0.3).line(m, y, pw - m, y);
      y += 6;

      // Dados do Cliente
      doc.setFontSize(8).setFont('helvetica', 'bold');
      doc.text('DADOS DO CLIENTE', m, y);
      y += 5;
      doc.setFontSize(7).setFont('helvetica', 'normal');
      doc.text('Codigo: ' + String(credito.entidade?.codigo || 'N/A'), m, y);
      doc.text('Nome: ' + String(credito.entidade?.nome || 'N/A'), m + 35, y);
      doc.text('Operador: ' + String(credito.criadoPor || 'N/A'), m + 100, y);
      y += 6;

      // Dados do Credito
      doc.setFontSize(8).setFont('helvetica', 'bold');
      doc.text('DADOS DO CREDITO', m, y);
      y += 5;
      doc.setFontSize(7).setFont('helvetica', 'normal');

      const colE = m;
      let ye = y;
      doc.setFont('helvetica', 'bold');
      doc.text('Credito N:', colE, ye);
      doc.setFont('helvetica', 'normal');
      doc.text(String(credito.numero || '-'), colE + 22, ye); ye += 4;

      doc.setFont('helvetica', 'bold');
      doc.text('Data Conc.:', colE, ye);
      doc.setFont('helvetica', 'normal');
      doc.text(credito.dataEmissao ? moment(credito.dataEmissao).format('DD/MM/YYYY') : '-', colE + 22, ye); ye += 4;

      doc.setFont('helvetica', 'bold');
      doc.text('Periodic.:', colE, ye);
      doc.setFont('helvetica', 'normal');
      doc.text(String(credito.periodicidade || '-'), colE + 22, ye); ye += 4;

      doc.setFont('helvetica', 'bold');
      doc.text('Forma Calc.:', colE, ye);
      doc.setFont('helvetica', 'normal');
      doc.text(String(credito.formaDeCalculo || '-'), colE + 22, ye);

      const colD = pw / 2 + 10;
      let yd = y;
      doc.setFont('helvetica', 'bold');
      doc.text('Juros:', colD, yd);
      doc.setFont('helvetica', 'normal');
      doc.text(String(credito.percentualDeJuros || 0) + '%', colD + 18, yd); yd += 4;

      doc.setFont('helvetica', 'bold');
      doc.text('Juros Mora:', colD, yd);
      doc.setFont('helvetica', 'normal');
      doc.text(String(credito.percentualJurosDeDemora || 0) + '%', colD + 18, yd); yd += 4;

      doc.setFont('helvetica', 'bold');
      doc.text('Prestacoes:', colD, yd);
      doc.setFont('helvetica', 'normal');
      doc.text(String(credito.numeroDePrestacoes || 0), colD + 18, yd); yd += 4;

      doc.setFont('helvetica', 'bold');
      doc.text('Status:', colD, yd);
      doc.setFont('helvetica', 'normal');
      doc.text(String(credito.status || 'Ativo'), colD + 18, yd);

      y = Math.max(ye, yd) + 4;

      // Valor Concedido
      const vf = Number(credito.valorConcedido || 0).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });
      doc.setFontSize(9).setFont('helvetica', 'bold');
      doc.text('VALOR CONCEDIDO: ' + vf, m, y);
      y += 8;

      // Tabela
 autoTable(doc, {
   startY: y,
   head: [head],
   body: body,
   foot: [foot],
   styles: { fontSize: 6.5, cellPadding: 1.2 },
   headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: 'bold', halign: 'center', minCellHeight: 6 },
   footStyles: {
     fillColor: [220, 220, 220],  // Fundo cinza claro
     textColor: 0,                  // TEXTO PRETO
     fontStyle: 'bold',
     minCellHeight: 6
   },
   margin: { left: m, right: m },
   columnStyles: {
     0: { halign: 'center', cellWidth: 10 },
     1: { halign: 'center', cellWidth: 14 },
     2: { halign: 'center', cellWidth: 22 },
     3: { halign: 'right', cellWidth: 26 },
     4: { halign: 'right', cellWidth: 26 },
     5: { halign: 'right', cellWidth: 22 },
     6: { halign: 'right', cellWidth: 26 },
     7: { halign: 'center', cellWidth: 18 },
   },
 });

      y = doc.lastAutoTable.finalY + 10;

      // Assinaturas
      if (y < 245) {
        doc.setFontSize(8).setFont('helvetica', 'bold');
        doc.text('ASSINATURAS', m, y);
        y += 6;
        const cw = (pw - m * 2) / 3;
        doc.setFont('helvetica', 'normal').setFontSize(7);
        doc.text('CLIENTE', m, y);
        doc.text('GERENTE', m + cw, y);
        doc.text('GESTOR DE CREDITO', m + cw * 2, y);
        y += 3;
        doc.line(m, y, m + cw - 8, y);
        doc.line(m + cw, y, m + cw * 2 - 8, y);
        doc.line(m + cw * 2, y, pw - m, y);
        y += 10;

        doc.setFontSize(6.5).setFont('helvetica', 'italic');
        doc.text('Pagamento nos balcoes ou depositar nas contas:', m, y); y += 4;
        doc.setFont('helvetica', 'normal');
        doc.text('BCI: 1234567890  |  BIM: 0987654321  |  MPESA: 859876543', m, y);
      }

      doc.save('Plano_Pagamento_' + String(credito.numero || 'Credito') + '.pdf');
      console.log('PDF gerado!');
    } catch (err) {
      console.error('Erro PDF:', err);
      alert('Erro: ' + err.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  if (error) return <Alert message="Erro" description={error} type="error" showIcon />;
  if (!credito) return <Alert message="Credito nao encontrado" type="warning" showIcon />;

  return (
    <Card
      title={'Credito ' + credito.numero}
      extra={
        <Space>
          <Button icon={<FilePdfOutlined />} onClick={gerarPlanoPagamentoPDF} type="primary">Imprimir Plano</Button>
          <Button icon={<DollarOutlined />} onClick={() => navigate('/creditos/' + id + '/parcelas')}>Ver Parcelas</Button>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/creditos')}>Voltar</Button>
        </Space>
      }
    >
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Numero">{credito.numero}</Descriptions.Item>
        <Descriptions.Item label="Status">{getStatusTag(credito.status)}</Descriptions.Item>
        <Descriptions.Item label="Entidade" span={2}>{credito.entidade?.nome || 'N/A'}{credito.entidade?.codigo && ' (Cod: ' + credito.entidade.codigo + ')'}</Descriptions.Item>
        <Descriptions.Item label="Valor Concedido">{formatarMoeda(credito.valorConcedido)}</Descriptions.Item>
        <Descriptions.Item label="Valor Total">{formatarMoeda(credito.valorTotal)}</Descriptions.Item>
        <Descriptions.Item label="Total Pago"><span style={{ color: '#52c41a' }}>{formatarMoeda(credito.totalPago)}</span></Descriptions.Item>
        <Descriptions.Item label="Saldo Devedor"><span style={{ color: credito.totalEmDivida > 0 ? '#ff4d4f' : '#52c41a' }}>{formatarMoeda(Math.abs(credito.totalEmDivida || 0))}</span></Descriptions.Item>
        <Descriptions.Item label="Taxa de Juros">{credito.percentualDeJuros}%</Descriptions.Item>
        <Descriptions.Item label="Juros de Demora">{credito.percentualJurosDeDemora}%</Descriptions.Item>
        <Descriptions.Item label="N de Prestacoes">{credito.numeroDePrestacoes}</Descriptions.Item>
        <Descriptions.Item label="Periodicidade">{credito.periodicidade}</Descriptions.Item>
        <Descriptions.Item label="Forma de Calculo">{credito.formaDeCalculo}</Descriptions.Item>
        <Descriptions.Item label="Data de Emissao">{credito.dataEmissao ? moment(credito.dataEmissao).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
        <Descriptions.Item label="Quitado">{credito.quitado ? <Tag color="green">Sim</Tag> : 'Nao'}</Descriptions.Item>
        <Descriptions.Item label="Em Mora">{credito.emMora ? <Tag color="red">Sim</Tag> : 'Nao'}</Descriptions.Item>
        <Descriptions.Item label="Ativo">{credito.ativo ? <Tag color="green">Sim</Tag> : 'Nao'}</Descriptions.Item>
        {credito.descricao && <Descriptions.Item label="Descricao" span={2}>{credito.descricao}</Descriptions.Item>}
      </Descriptions>
    </Card>
  );
};

export default CreditoShow;