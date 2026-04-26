// src/services/pdfService.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';

const pdfService = {
  gerarPlanoPagamento(credito) {
    console.log('📄 [PDF] Iniciando geração...');
    console.log('📄 [PDF] Crédito:', credito?.numero);
    console.log('📄 [PDF] Parcelas recebidas:', credito?.parcelas?.length);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    // ============================================================
    // CABEÇALHO
    // ============================================================
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PLANO DE PAGAMENTO', pageWidth / 2, y + 10, { align: 'center' });
    y += 20;

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ============================================================
    // DADOS DO CLIENTE
    // ============================================================
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE', margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Código: ${credito.entidade?.codigo || credito.entidadeCodigo || 'N/A'}`, margin, y);
    y += 5;
    doc.text(`Nome: ${credito.entidade?.nome || credito.entidadeNome || 'N/A'}`, margin, y);
    y += 5;
    doc.text(`Operador: ${credito.criadoPor || 'N/A'}`, margin, y);
    y += 8;

    // ============================================================
    // DADOS DO CRÉDITO
    // ============================================================
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CRÉDITO', margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const infoLinhas = [
      { left: `Crédito Nº: ${credito.numero || '-'}`, right: `Juros: ${credito.percentualDeJuros || 0}%` },
      { left: `Data Concessão: ${credito.dataEmissao ? moment(credito.dataEmissao).format('DD/MM/YYYY') : '-'}`, right: `Juros Mora: ${credito.percentualJurosDeDemora || 0}%` },
      { left: `Periodicidade: ${credito.periodicidade || '-'}`, right: `Forma Cálculo: ${credito.formaDeCalculo || '-'}` },
      { left: `Nº Prestações: ${credito.numeroDePrestacoes || 0}`, right: `Status: ${credito.status || 'Ativo'}` },
    ];

    infoLinhas.forEach(linha => {
      doc.setFont('helvetica', 'bold');
      doc.text(linha.left.split(':')[0] + ':', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(linha.left.split(':')[1] || '', margin + 35, y);

      doc.setFont('helvetica', 'bold');
      doc.text(linha.right.split(':')[0] + ':', pageWidth / 2 + 10, y);
      doc.setFont('helvetica', 'normal');
      doc.text(linha.right.split(':')[1] || '', pageWidth / 2 + 35, y);
      y += 5;
    });
    y += 5;

    // Valor Creditado
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const valorFormatado = new Intl.NumberFormat('pt-MZ', {
      style: 'currency', currency: 'MZN'
    }).format(credito.valorConcedido || 0);
    doc.text(`VALOR CONCEDIDO: ${valorFormatado}`, pageWidth - margin - 80, y);
    y += 12;

    // ============================================================
    // TABELA DE PARCELAS
    // ============================================================
    if (credito.parcelas && credito.parcelas.length > 0) {
      const parcelasOrdenadas = [...credito.parcelas].sort((a, b) => (a.numero || 0) - (b.numero || 0));

      const fmt = (valor) => {
        const num = parseFloat(valor) || 0;
        return num.toLocaleString('pt-MZ', {
          style: 'currency', currency: 'MZN',
          minimumFractionDigits: 2, maximumFractionDigits: 2
        });
      };

      const columns = [
        { header: 'Nº', dataKey: 'n' },
        { header: 'Vencimento', dataKey: 'v' },
        { header: 'Valor Parcela', dataKey: 'vp' },
        { header: 'Amortização', dataKey: 'a' },
        { header: 'Juros', dataKey: 'j' },
        { header: 'Saldo Devedor', dataKey: 's' },
        { header: 'Status', dataKey: 'st' },
      ];



      const totalParcela = parcelasOrdenadas.reduce((s, p) => s + (parseFloat(p.valorParcela) || 0), 0);
      const totalAmort = parcelasOrdenadas.reduce((s, p) => s + (parseFloat(p.valorAmortizacao) || 0), 0);
      const totalJuros = parcelasOrdenadas.reduce((s, p) => s + (parseFloat(p.valorJuros) || 0), 0);
      const ultimoSaldo = parcelasOrdenadas.length > 0
        ? parseFloat(parcelasOrdenadas[parcelasOrdenadas.length - 1].saldoDevedor) || 0 : 0;

      doc.autoTable({
        startY: y,
        head: [[columns.map(c => c.header)]],
        body: body.map(r => [r.n, r.v, r.vp, r.a, r.j, r.s, r.st]),
        foot: [[
          '', '', 'TOTAIS', fmt(totalAmort), fmt(totalJuros), fmt(ultimoSaldo), ''
        ]],
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: 'bold', halign: 'center' },
        footStyles: { fillColor: [220, 220, 220], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'center', cellWidth: 22 },
          2: { halign: 'right', cellWidth: 28 },
          3: { halign: 'right', cellWidth: 28 },
          4: { halign: 'right', cellWidth: 24 },
          5: { halign: 'right', cellWidth: 28 },
          6: { halign: 'center', cellWidth: 22 },
        },
      });

      y = doc.lastAutoTable.finalY + 15;
    }

    // Assinaturas e rodapé...
    if (y > 160) { doc.addPage(); y = margin; }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSINATURAS', margin, y);
    y += 8;

    const colW = (pageWidth - margin * 2) / 3;
    doc.setFont('helvetica', 'normal');
    doc.text('CLIENTE', margin, y);
    doc.text('GERENTE', margin + colW, y);
    doc.text('GESTOR DE CRÉDITO', margin + colW * 2, y);
    y += 5;
    doc.line(margin, y, margin + colW - 10, y);
    doc.line(margin + colW, y, margin + colW * 2 - 10, y);
    doc.line(margin + colW * 2, y, pageWidth - margin, y);
    y += 15;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('O cliente poderá efetuar o pagamento nos nossos balcões ou depositar nas seguintes contas:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('BCI: 1234567890 | BIM: 0987654321 | MPESA: 859876543', margin, y);

    const fileName = `Plano_Pagamento_${credito.numero || 'Credito'}.pdf`;
    doc.save(fileName);
    return true;
  }
};

export default pdfService;
