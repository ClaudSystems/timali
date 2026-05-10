// src/services/diarioPdfService.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';
import logo from '../assets/images/logo.png'; // Importar o logo

const formatarMoeda = (v) => new Intl.NumberFormat('pt-MZ', {
    style: 'currency', currency: 'MZN', minimumFractionDigits: 2
}).format(v || 0);

const formatarNumero = (v) => new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(v || 0);

/**
 * Gera PDF do Diário de Caixa conforme template do sistema
 * @param {Object} diario - Dados do diário retornados pela API
 */
export const gerarPdfDiario = async (diario) => {
    if (!diario) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - (margin * 2);
    let y = margin;

    // ========== LOGO ==========
    // ========== LOGO ==========
    try {
        const img = new Image();
        img.src = logo;

        await new Promise((resolve) => {
            img.onload = () => {
                // Tamanho máximo do logo
                const maxWidth = 60;   // largura máxima em mm
                const maxHeight = 25;  // altura máxima em mm

                // Calcular proporção
                const aspectRatio = img.width / img.height;
                let logoWidth = maxWidth;
                let logoHeight = logoWidth / aspectRatio;

                // Se altura ultrapassar o máximo, ajustar pela altura
                if (logoHeight > maxHeight) {
                    logoHeight = maxHeight;
                    logoWidth = logoHeight * aspectRatio;
                }

                // Centralizar
                const logoX = (pageWidth - logoWidth) / 2;

                doc.addImage(logo, 'PNG', logoX, y, logoWidth, logoHeight);
                y += logoHeight + 5;

                resolve();
            };
            img.onerror = () => resolve(); // Se falhar, continua sem logo
        });
    } catch (e) {
        console.warn('Logo não encontrada:', e);
    }

    // ========== LINHA SEPARADORA ==========
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ========== CABEÇALHO - DIÁRIO Nº ==========
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Diário', margin, y);
    doc.text('Nº.', margin + 60, y);
    doc.text(diario.numeroDiario || 'N/I', margin + 80, y);
    y += 8;

    // ========== DATAS ==========
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');

    const headerData = [[
        'Data de Referência',
        'Data de Criação',
        'Data de Atualização'
    ]];

    const headerValues = [[
        moment(diario.dataReferencia).format('DD/MM/YY'),
        diario.dateCreated ? moment(diario.dateCreated).format('DD/MM/YY') : '-',
        diario.lastUpdated ? moment(diario.lastUpdated).format('DD/MM/YY') : '-'
    ]];

    doc.autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        head: headerData,
        body: headerValues,
        styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
        headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255] },
        theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 5;

    // ========== RECEBIMENTOS ==========
    adicionarTabelaRecebimentos(doc, diario, margin, y, usableWidth);
    y = doc.lastAutoTable.finalY + 5;

    // ========== SAÍDAS ATIVAS (BANCOS/TRANSFERÊNCIAS) ==========
    if (diario.saidasAtivas && diario.saidasAtivas.length > 0) {
        if (y > 200) {
            doc.addPage();
            y = margin;
        }
        adicionarTabelaSaidas(doc, diario.saidasAtivas, 'Saidas', diario.totais?.totalSaidasAtivas, margin, y, [0, 100, 0]);
        y = doc.lastAutoTable.finalY + 5;
    }

    // ========== SAÍDAS PASSIVAS (SAÍDAS) ==========
    if (diario.saidasPassivas && diario.saidasPassivas.length > 0) {
        if (y > 200) {
            doc.addPage();
            y = margin;
        }
        adicionarTabelaSaidas(doc, diario.saidasPassivas, 'Saídas', diario.totais?.totalSaidasPassivas, margin, y, [139, 0, 0]);
        y = doc.lastAutoTable.finalY + 8;
    }

    // ========== RESUMO FINAL ==========
    if (y > 230) {
        doc.addPage();
        y = margin;
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    const totais = diario.totais || {};
    const resumoFinal = [
        ['Total Recebimentos', formatarMoeda(totais.totalRecebimentos || 0)],
        ['Total Saídas', formatarMoeda(totais.totalSaidas || 0)],
        ['Saldo em Caixa', formatarMoeda(totais.saldo || 0)]
    ];

    doc.autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        body: resumoFinal,
        styles: { fontSize: 11, cellPadding: 4 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
            1: { halign: 'right', fontStyle: 'bold' }
        },
        theme: 'plain',
        didDrawCell: (data) => {
            if (data.row.index === 2) {
                doc.setTextColor(totais.saldo >= 0 ? '#0000CD' : '#FF0000');
            }
        }
    });
    doc.setTextColor(0);
    y = doc.lastAutoTable.finalY + 5;

    // ========== NOTAS ==========
    if (diario.notas) {
        if (y > 220) {
            doc.addPage();
            y = margin;
        }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Notas', margin, y);
        y += 7;
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(diario.notas, margin, y, { maxWidth: usableWidth });
        y += 10;
    }

    // ========== VALIDAÇÕES (ASSINATURAS) ==========
    if (diario.fechado) {
        if (y > 210) {
            doc.addPage();
            y = margin;
        }

        y += 10;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Validações', margin, y);
        y += 8;

        // Cabeçalho das assinaturas
        doc.setFontSize(10);
        doc.text('Responsável da CAIXA', margin, y);
        doc.text('GERENTE', pageWidth / 2 + 5, y);
        y += 6;

        // Linhas para assinatura
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        for (let i = 0; i < 2; i++) {
            doc.line(margin, y, margin + 70, y);
            doc.line(pageWidth / 2 + 5, y, pageWidth / 2 + 75, y);
            y += 15;
        }

        // Nome do responsável
        if (diario.fechadoPor) {
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.text(diario.fechadoPor, margin, y - 12);
        }
    }

    // ========== RODAPÉ ==========
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.text(
            `Gerado por Timali em ${moment().format('DD/MM/YYYY HH:mm')}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: 'center' }
        );
    }

    // ========== SALVAR PDF ==========
    const nomeArquivo = `${diario.numeroDiario || 'diario'}_${moment(diario.dataReferencia).format('YYYYMMDD')}.pdf`;
    doc.save(nomeArquivo);
};

/**
 * Adiciona tabela de Recebimentos
 */
function adicionarTabelaRecebimentos(doc, diario, margin, y) {
    // Título da seção
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Recebimentos', margin, y);
    y += 6;

    if (!diario.recebimentos || diario.recebimentos.length === 0) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Nenhum recebimento neste dia.', margin, y);
        doc.autoTable({
            startY: y + 5,
            margin: { left: margin, right: margin },
            body: [['', '', '', '', '', '', '', '']],
            styles: { fontSize: 8, cellPadding: 2 },
            theme: 'grid'
        });
        return;
    }

    const recebimentosData = diario.recebimentos.map(r => [
        r.numeroRecibo || '-',
        r.nomeCliente || '-',
        r.descricao || '-',
        moment(r.dataPagamento).format('DD/MM'),
        r.formaPagamento || '-',
        formatarNumero(r.valorPago || 0),
        r.utilizador || r.criadoPor || '-'
    ]);

    // Linha de totais
    const totalRecebimentos = diario.totais?.totalRecebimentos || 0;
    recebimentosData.push([
        '', '', '', '', 'Total:', formatarNumero(totalRecebimentos), ''
    ]);

    doc.autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        head: [[
            'Recibo Nº', 'Cliente', 'Descrição', 'D. de P.',
            'Forma de Pag.', 'Valor Pago', 'Utilizador'
        ]],
        body: recebimentosData,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [0, 100, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 25, halign: 'center' },
            5: { cellWidth: 25, halign: 'right' },
            6: { cellWidth: 20, halign: 'center' }
        },
        footStyles: { fontStyle: 'bold', fillColor: [230, 255, 230] },
        theme: 'grid',
        didParseCell: (data) => {
            // Última linha (total) em negrito
            if (data.row.index === recebimentosData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });
}

/**
 * Adiciona tabela de Saídas (Ativas ou Passivas)
 */
function adicionarTabelaSaidas(doc, saidas, titulo, total, margin, y, corCabecalho) {
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text(titulo, margin, y);
    y += 6;

    if (!saidas || saidas.length === 0) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Nenhuma saída neste dia.', margin, y);
        return;
    }

    const saidasData = saidas.map(s => [
        moment(s.dateCreated).format('HH:mm-DD/MM'),
        moment(s.dataPagamento || s.dataSaida).format('DD/MM'),
        s.descricao || '-',
        s.origem || '-',
        s.destino || s.tipo || '-',
        formatarNumero(s.valor || 0),
        s.utilizador || s.criadoPor || '-'
    ]);

    // Linha de total
    saidasData.push([
        '', '', '', '', 'Total:', formatarNumero(total || 0), ''
    ]);

    doc.autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        head: [[
            'Data Criação', 'Data Pag.', 'Descrição',
            'Forma de Pag.', 'Descrição', 'Valor'
        ]],
        body: saidasData,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: corCabecalho, textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 },
            5: { cellWidth: 25, halign: 'right' },

        },
        footStyles: { fontStyle: 'bold' },
        theme: 'grid',
        didParseCell: (data) => {
            if (data.row.index === saidasData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = corCabecalho[0] === 0 ? [230, 255, 230] : [255, 230, 230];
            }
        }
    });
}