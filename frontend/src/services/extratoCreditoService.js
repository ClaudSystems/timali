// src/services/extratoCreditoService.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';
import logoRecibo from '../assets/images/logo.png';

const safeString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && value !== null) {
        if (value.name) return String(value.name);
        return '';
    }
    return String(value);
};

const formatarMoeda = (valor) => {
    return Number(valor || 0).toLocaleString('pt-MZ', {
        style: 'currency', currency: 'MZN', minimumFractionDigits: 2
    });
};

const formatarNumero = (valor) => {
    return Number(valor || 0).toFixed(2).replace('.', ',');
};

const extratoCreditoService = {
    async gerarExtrato(dados) {
        const { credito, cliente, linhas, totais } = dados;

        if (!credito || !linhas) {
            console.error('Dados inválidos para gerar extrato');
            return;
        }

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pw = doc.internal.pageSize.getWidth();
        const m = 10;
        let y = 5;

        // ============================================================
        // CABEÇALHO - LOGO
        // ============================================================
        try {
            doc.addImage(logoRecibo, 'PNG', pw / 2 - 35, y, 70, 15);
            y += 21;
        } catch (e) {
            y += 5;
        }

        // ============================================================
        // TÍTULO
        // ============================================================
        doc.setFontSize(14).setFont('helvetica', 'bold');
        doc.text('EXTRATO DE CRÉDITO', pw / 2, y, { align: 'center' });

        doc.setFontSize(8).setFont('helvetica', 'normal');
        doc.text('Data: ' + moment().format('DD/MM/YY HH:mm'), pw - m, y, { align: 'right' });
        y += 8;

        doc.setDrawColor(0).setLineWidth(0.4).line(m, y, pw - m, y);
        y += 6;



        // ============================================================
        // DADOS DO CLIENTE
        // ============================================================
        doc.setFontSize(9).setFont('helvetica', 'bold');
        doc.text('DADOS DO CLIENTE', m, y);
        doc.setFontSize(7).setFont('helvetica', 'normal');
        doc.text('Operador: ' + safeString(credito.criadoPor), pw - m, y, { align: 'right' });
        y += 5;

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('CÓDIGO DO CLIENTE:', m, y);
        doc.setFont('helvetica', 'normal');
        doc.text(safeString(cliente?.codigo), m + 32, y);
        y += 4;

        doc.setFont('helvetica', 'bold');
        doc.text('Nome:', m, y);
        doc.setFont('helvetica', 'normal');
        doc.text(safeString(cliente?.nome).toUpperCase(), m + 12, y);
        y += 4;

        doc.setFont('helvetica', 'bold');
        doc.text(safeString(cliente?.tipoDocumento) || 'BI', m, y);
        doc.setFont('helvetica', 'normal');
        doc.text(' Nº ' + safeString(cliente?.documento), m + 15, y);
        doc.text('Telf.: ' + safeString(cliente?.telefone), m + 80, y);
        y += 6;

        // ============================================================
        // DADOS DO CRÉDITO
        // ============================================================
        doc.setDrawColor(180).setLineWidth(0.2).line(m, y, pw - m, y);
        y += 4;
        doc.setFontSize(9).setFont('helvetica', 'bold');
        doc.text('DADOS DE CRÉDITO', pw / 2, y, { align: 'center' });
        y += 6;

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('Data da Concessão:', m, y);
        doc.setFont('helvetica', 'normal');
        doc.text(credito.dataEmissao ? moment(credito.dataEmissao).format('DD/MM/YYYY') : '-', m + 30, y);

        const valorPrestacao = Number(credito.numeroDePrestacoes) > 0
            ? (Number(credito.valorTotal) || 0) / Number(credito.numeroDePrestacoes)
            : 0;
        doc.setFont('helvetica', 'bold');
        doc.text('V. por prestação:', m + 75, y);
        doc.setFont('helvetica', 'normal');
        doc.text(formatarNumero(valorPrestacao), m + 93, y);

        doc.setFont('helvetica', 'bold');
        doc.text('Juros:', m + 120, y);
        doc.setFont('helvetica', 'normal');
        doc.text((credito.percentualDeJuros || 0) + '%', m + 130, y);
        y += 4;

        doc.setFont('helvetica', 'bold');
        doc.text('Valor Creditado:', m, y);
        doc.setFont('helvetica', 'normal');
        doc.text(formatarMoeda(credito.valorConcedido || 0), m + 27, y);

        doc.setFont('helvetica', 'bold');
        doc.text('Juros De Mora:', m + 75, y);
        doc.setFont('helvetica', 'normal');
        doc.text((credito.percentualJurosDeDemora || 0) + '%', m + 90, y);

        doc.setFont('helvetica', 'bold');
        doc.text('Periodicidade:', m + 120, y);
        doc.setFont('helvetica', 'normal');
        doc.text(safeString(credito.periodicidade), m + 138, y);
        y += 4;

        doc.setFont('helvetica', 'bold');
        doc.text('Crédito Nº:', m, y);
        doc.setFont('helvetica', 'normal');
        doc.text(safeString(credito.numero), m + 18, y);

        doc.setFont('helvetica', 'bold');
        doc.text('Nº de Prestações:', m + 75, y);
        doc.setFont('helvetica', 'normal');
        doc.text((credito.numeroDePrestacoesEmDia || 0) + '/' + (credito.numeroDePrestacoes || 0), m + 96, y);

        doc.setFont('helvetica', 'bold');
        doc.text('Forma de cálculo:', m + 120, y);
        doc.setFont('helvetica', 'normal');
        doc.text(safeString(credito.formaDeCalculo), m + 140, y);
        y += 8;

        // ============================================================
        // TABELA DE EXTRATO
        // ============================================================
        const head = ['Data', 'Descrição', 'Débito', 'Crédito', 'V. em Mora', 'Juros Mora', 'Dias', 'Saldo'];

        const body = linhas.map(linha => [
            linha.data ? moment(linha.data).format('DD/MM/YY') : '-',
            safeString(linha.descricao),
            Number(linha.debito) > 0 ? formatarNumero(linha.debito) : '',
            Number(linha.credito) > 0 ? formatarNumero(linha.credito) : '',
            Number(linha.valorEmMora) > 0 ? formatarNumero(linha.valorEmMora) : '',
            Number(linha.jurosDeMora) > 0 ? formatarNumero(linha.jurosDeMora) : '',
            Number(linha.diasDeMora) > 0 ? String(linha.diasDeMora) : '',
            formatarNumero(linha.saldo || 0),
        ]);

        const foot = [
            '', 'TOTAIS',
            formatarNumero(totais?.totalDebito || 0),
            formatarNumero(totais?.totalCredito || 0),
            formatarNumero(totais?.totalMoras || 0),
            formatarNumero(totais?.totalJurosDeMora || 0),
            '',
            formatarNumero(totais?.totalEmMora || 0)
        ];

        doc.autoTable({
            startY: y,
            head: [head],
            body: body,
            foot: [foot],
            styles: { fontSize: 6, cellPadding: 1 },
            headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold', halign: 'center', minCellHeight: 5 },
            footStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', minCellHeight: 5 },
            bodyStyles: { valign: 'middle' },
            margin: { left: m, right: m },
            columnStyles: {
                0: { cellWidth: 18, halign: 'center' },
                1: { cellWidth: 55, halign: 'left' },
                2: { cellWidth: 22, halign: 'right', fillColor: [149, 213, 178] },
                3: { cellWidth: 22, halign: 'right', fillColor: [202, 240, 248] },
                4: { cellWidth: 20, halign: 'right', fillColor: [237, 186, 139] },
                5: { cellWidth: 20, halign: 'right', fillColor: [242, 218, 198] },
                6: { cellWidth: 12, halign: 'center', fillColor: [210, 218, 192] },
                7: { cellWidth: 22, halign: 'right', fillColor: [255, 203, 242] },
            },
        });

        y = doc.lastAutoTable.finalY + 5;

        // ============================================================
        // SALVAR
        // ============================================================
        const fileName = `Extrato_Credito_${safeString(credito.numero)}.pdf`;
        doc.save(fileName);
        console.log('📄 Extrato gerado com sucesso:', fileName);
    }
};

export default extratoCreditoService;