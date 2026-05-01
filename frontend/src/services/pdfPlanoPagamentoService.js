// src/services/pdfPlanoPagamentoService.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';

const pdfPlanoPagamentoService = {
  gerarPlanoPagamento(credito) {
    console.log('📄 [PDF] Iniciando geração...');
    console.log('📄 [PDF] Crédito:', credito?.numero);
    console.log('📄 [PDF] Parcelas recebidas:', credito?.parcelas?.length);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const m = 12;
    let y = m;

    // ============================================================
    // TÍTULO
    // ============================================================
    doc.setFontSize(14).setFont('helvetica', 'bold');
    doc.text('PLANO DE PAGAMENTO', pw / 2, y + 5, { align: 'center' });
    y += 14;
    doc.setDrawColor(0).setLineWidth(0.3).line(m, y, pw - m, y);
    y += 6;

    // ============================================================
    // DADOS DO CLIENTE
    // ============================================================
    doc.setFontSize(8).setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE', m, y);
    y += 5;
    doc.setFontSize(7).setFont('helvetica', 'normal');
    doc.text('Codigo: ' + String(credito.entidade?.codigo || credito.entidadeCodigo || 'N/A'), m, y);
    doc.text('Nome: ' + String(credito.entidade?.nome || credito.entidadeNome || 'N/A'), m + 35, y);
    doc.text('Operador: ' + String(credito.criadoPor || 'N/A'), m + 100, y);
    y += 6;

    // ============================================================
    // DADOS DO CRÉDITO
    // ============================================================
    doc.setFontSize(8).setFont('helvetica', 'bold');
    doc.text('DADOS DO CREDITO', m, y);
    y += 5;
    doc.setFontSize(7).setFont('helvetica', 'normal');

    // Coluna esquerda
    const colE = m;
    let ye = y;
    doc.setFont('helvetica', 'bold');
    doc.text('Credito N:', colE, ye);
    doc.setFont('helvetica', 'normal');
    doc.text(String(credito.numero || '-'), colE + 22, ye); ye += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('Data Conc.:', colE, ye);
    doc.setFont('helvetica', 'normal');
    const dataConc = credito.dataEmissao || credito.dateConcecao || credito.dataConcessao;
    doc.text(dataConc ? moment(dataConc).format('DD/MM/YYYY') : '-', colE + 22, ye); ye += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('Periodic.:', colE, ye);
    doc.setFont('helvetica', 'normal');
    doc.text(String(credito.periodicidade || '-'), colE + 22, ye); ye += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('Forma Calc.:', colE, ye);
    doc.setFont('helvetica', 'normal');
    doc.text(String(credito.formaDeCalculo || '-'), colE + 22, ye);

    // Coluna direita
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

    // ============================================================
    // TABELA DE PARCELAS
    // ============================================================
    if (credito.parcelas && credito.parcelas.length > 0) {
      const parcelasOrdenadas = [...credito.parcelas].sort((a, b) => (a.numero || 0) - (b.numero || 0));

      const fmt = (v) => {
        const n = Number(v) || 0;
        return n.toFixed(2).replace('.', ',') + ' MTn';
      };

      const body = parcelasOrdenadas.map(p => {
        let d = '-';
        if (p.dataVencimento) {
          const mm = moment(p.dataVencimento);
          d = mm.isValid() ? mm.format('DD/MM/YY') : String(p.dataVencimento).substring(0, 10);
        }
        return [
          String(p.numero || ''),
          String(p.numero || '') + 'a',
          String(d),
          fmt(p.valorParcela),
          fmt(p.valorAmortizacao),
          fmt(p.valorJuros),
          fmt(p.saldoDevedor),
          String(p.status || 'Pendente'),
        ];
      });

      const tp = parcelasOrdenadas.reduce((s, p) => s + (Number(p.valorParcela) || 0), 0);
      const ta = parcelasOrdenadas.reduce((s, p) => s + (Number(p.valorAmortizacao) || 0), 0);
      const tj = parcelasOrdenadas.reduce((s, p) => s + (Number(p.valorJuros) || 0), 0);

      const head = ['N', 'Desc', 'Vencimento', 'Prestacao', 'Amortizacao', 'Juros', 'Saldo Dev.', 'Status'];
      const foot = ['', '', 'TOTAIS', fmt(tp), fmt(ta), fmt(tj), '', ''];

      doc.autoTable({
        startY: y,
        head: [head],
        body: body,
        foot: [foot],
        styles: { fontSize: 6.5, cellPadding: 1.2 },
        headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: 'bold', halign: 'center', minCellHeight: 6 },
        footStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', minCellHeight: 6 },
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
    }

    // ============================================================
    // ASSINATURAS
    // ============================================================
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

    // ============================================================
    // SALVAR
    // ============================================================
    const fileName = `Plano_Pagamento_${credito.numero || 'Credito'}.pdf`;
    doc.save(fileName);
    console.log('📄 [PDF] Gerado com sucesso:', fileName);
    return true;
  }
};

export default pdfPlanoPagamentoService;