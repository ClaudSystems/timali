// src/components/caixa/ReciboPagamento.jsx
import React from 'react';
import { Button, Space, message } from 'antd';
import { PrinterOutlined, FilePdfOutlined, CloseOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/pt';
import { jsPDF } from 'jspdf';

// Import da imagem do cabeçalho
import logoRecibo from '../../assets/images/logo.png';

moment.locale('pt');

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

const numeroPorExtenso = (valor) => {
    if (!valor || valor === 0) return 'zero meticais';
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const dezAVinte = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove'];
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cem', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    const converterCentenas = (num) => {
        if (num === 0) return '';
        if (num === 100) return 'cem';
        let r = '';
        const c = Math.floor(num / 100);
        const d = Math.floor((num % 100) / 10);
        const u = num % 10;
        if (c > 0) r += (c === 1 && (d > 0 || u > 0)) ? 'cento ' : centenas[c] + ' ';
        if (d === 1) { r += dezAVinte[u] + ' '; }
        else {
            if (d > 1) r += dezenas[d] + ' ';
            if (u > 0 || (c === 0 && d === 0)) r += unidades[u] + ' ';
        }
        return r.trim();
    };

    const converterParteInteira = (num) => {
        if (num === 0) return '';
        let r = '';
        const milhares = Math.floor(num / 1000);
        const resto = num % 1000;
        if (milhares > 0) r += milhares === 1 ? 'mil ' : converterCentenas(milhares) + ' mil ';
        if (resto > 0) r += converterCentenas(resto);
        return r.trim();
    };

    const inteiro = Math.floor(valor);
    const centavos = Math.round((valor - inteiro) * 100);
    let extenso = converterParteInteira(inteiro) || 'zero';
    extenso += ' meticais';
    if (centavos > 0) extenso += ` e ${converterParteInteira(centavos)} centavos`;
    return extenso;
};

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor || 0);
};

const formatarNumero = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor || 0);
};

// ============================================
// DESENHAR RECIBO A5 (meia folha)
// ============================================
const desenharReciboA5 = (doc, pagamento, startY, isCopia) => {
    const pageW = 210;
    const ml = 14; // margin left
    const mr = 14; // margin right
    const cw = pageW - ml - mr; // content width
    const maxBottom = startY + 138; // altura máxima do A5

    let y = startY;

    // --- Marca d'água CÓPIA ---
    if (isCopia) {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.04 }));
        doc.setFontSize(42);
        doc.setTextColor(0, 0, 0);
        doc.text('CÓPIA', pageW / 2, startY + 65, { align: 'center', angle: -25 });
        doc.restoreGraphicsState();
    }

    // --- Imagem do Cabeçalho ---
    try {
        const imgW = 125;
        const imgH = 27;
        doc.addImage(logoRecibo, 'PNG', (pageW - imgW) / 2, y, imgW, imgH);
        y += imgH + 2;
    } catch (e) {
        doc.setFontSize(12);
        doc.text('MICROCRÉDITO', pageW / 2, y + 8, { align: 'center' });
        y += 16;
    }

    // Linha fina
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(ml, y, pageW - mr, y);
    y += 3;

    // --- Título ---
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('RECIBO', pageW / 2, y, { align: 'center' });
    y += 3.5;
    doc.setFontSize(8);
    doc.text(`Nº ${pagamento.numeroRecibo || '______'}`, pageW / 2, y, { align: 'center' });
    y += 4.5;

    // --- Dados (compacto) ---
    doc.setFontSize(7);
    const lx = ml;       // label x
    const vx = ml + 25;  // value x
    const lh = 3.5;      // line height

    const linhas = [
        ['Data/Hora:', moment(pagamento.dataPagamento).format('HH:mm - DD/MM/YYYY')],
        ['Operador:', pagamento.nomeOperador || pagamento.operador || pagamento.usuario || '___________'],
        ['Recebemos de:', (pagamento.cliente || '').toUpperCase()],
        ['BI/NUIT:', pagamento.documento || pagamento.nuit || '__________'],
        ['Forma Pag.:', pagamento.formaPagamento || 'numerário'],
        ['Valor:', formatarMoeda(pagamento.valorPago)],
    ];

    linhas.forEach(([label, valor]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, lx, y);
        doc.setFont(undefined, 'normal');
        doc.text(String(valor), vx, y);
        y += lh;
    });

    // Valor por extenso
    doc.setFontSize(6);
    doc.setFont(undefined, 'italic');
    const extenso = numeroPorExtenso(pagamento.valorPago);
    const extLinhas = doc.splitTextToSize(`(${extenso})`, cw);
    extLinhas.forEach(linha => {
        doc.text(linha, ml, y);
        y += 2.8;
    });
    doc.setFont(undefined, 'normal');

    // Ref. Crédito
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('Ref. Crédito:', lx, y);
    doc.setFont(undefined, 'normal');
    doc.text(`Nº ${pagamento.numeroCredito || pagamento.credito || '____'}`, vx, y);
    y += 4.5;

    // --- Tabela de Parcelas ---
    const tableTop = y;
    const c1x = ml;
    const c2x = ml + 50;
    const c3x = ml + 100;
    const c1w = 50;
    const c2w = 50;
    const c3w = 36;

    // Cabeçalho da tabela
    doc.setFillColor(245, 245, 245);
    doc.rect(c1x, y, c1w, 4, 'F');
    doc.rect(c2x, y, c2w, 4, 'F');
    doc.rect(c3x, y, c3w, 4, 'F');
    doc.setFontSize(6.5);
    doc.setFont(undefined, 'bold');
    doc.text('Parcela(s)', c1x + 1, y + 2.8);
    doc.text('Valor', c2x + c2w - 1, y + 2.8, { align: 'right' });
    doc.text('Descrição', c3x + 1, y + 2.8);
    y += 4;

    // Linhas
    doc.setFont(undefined, 'normal');
    if (pagamento.parcelasPagas && pagamento.parcelasPagas.length > 0) {
        pagamento.parcelasPagas.forEach((p) => {
            doc.text(`${p.numero}ª Prest.`, c1x + 1, y + 2.5);
            doc.text(formatarNumero(p.valorAlocado || p.valor), c2x + c2w - 1, y + 2.5, { align: 'right' });
            doc.text('Amortização', c3x + 1, y + 2.5);
            doc.setDrawColor(230, 230, 230);
            doc.line(c1x, y + 3.5, c3x + c3w, y + 3.5);
            y += 3.5;
        });
    } else {
        doc.text('Prestação', c1x + 1, y + 2.5);
        doc.text(formatarNumero(pagamento.valorPago), c2x + c2w - 1, y + 2.5, { align: 'right' });
        doc.text('Amortização', c3x + 1, y + 2.5);
        y += 3.5;
    }

    // Total
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(c1x, y, c3x + c3w, y);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', c1x + 1, y + 2.8);
    doc.text(formatarNumero(pagamento.totalAlocado || pagamento.valorPago), c2x + c2w - 1, y + 2.8, { align: 'right' });
    doc.setFont(undefined, 'normal');
    y += 4;

    // Borda da tabela
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(c1x, tableTop, c1w + c2w + c3w, y - tableTop);
    y += 2;

    // --- Saldo Devedor ---
    doc.setFillColor(248, 248, 248);
    doc.rect(ml, y, cw, 4.5, 'F');
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('Saldo em Dívida:', ml + 2, y + 3);
    doc.setFont(undefined, 'normal');
    doc.text(formatarMoeda(pagamento.saldoDevedor || 0), pageW - mr - 2, y + 3, { align: 'right' });
    y += 6;

    // --- Troco ---
    if (pagamento.troco > 0) {
        doc.setTextColor(180, 80, 0);
        doc.setFont(undefined, 'bold');
        doc.text('Troco:', ml, y);
        doc.text(formatarMoeda(pagamento.troco), pageW - mr, y, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        y += 4;
    }

    y += 2;

    // --- Assinaturas ---
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('Assinaturas:', ml, y);
    y += 8;
    const assY = y;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(ml, assY, ml + 65, assY);
    doc.line(pageW - mr - 65, assY, pageW - mr, assY);
    doc.setFont(undefined, 'normal');
    doc.text('CAIXA', ml + 32, assY + 3, { align: 'center' });
    doc.text('CLIENTE', pageW - mr - 32, assY + 3, { align: 'center' });

    // --- Rodapé ---
    doc.setFontSize(5);
    doc.setTextColor(160, 160, 160);
    doc.text('Sistema de Gestão de Microcrédito', pageW / 2, maxBottom - 1, { align: 'center' });
    doc.setTextColor(0, 0, 0);
};

// ============================================
// GERAR PDF - 1 A4 com Original + Cópia
// ============================================
const gerarPDF = async (pagamento) => {
    try {
        message.loading({ content: 'Gerando PDF...', key: 'pdf' });

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageHeight = 297;
        const halfPage = pageHeight / 2; // 148.5mm

        // --- PRIMEIRA METADE: ORIGINAL ---
        desenharReciboA5(doc, pagamento, 6, false);

        // --- LINHA DE CORTE ---
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.setLineDash([3, 3], 0);
        doc.line(12, halfPage, 198, halfPage);
        doc.setLineDash([], 0);
        doc.setFontSize(5.5);
        doc.setTextColor(160, 160, 160);
        doc.text('✂ Destaque aqui ✂', 105, halfPage + 2.5, { align: 'center' });
        doc.text('✂ Destaque aqui ✂', 105, halfPage - 1, { align: 'center' });
        doc.setTextColor(0, 0, 0);

        // --- SEGUNDA METADE: CÓPIA ---
        desenharReciboA5(doc, pagamento, halfPage + 6, true);

        // Salvar
        const fileName = `Recibo_${pagamento.numeroRecibo || 'pagamento'}.pdf`;
        doc.save(fileName);

        message.success({ content: 'PDF gerado com sucesso!', key: 'pdf' });
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        message.error({ content: 'Erro ao gerar PDF', key: 'pdf' });
    }
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const ReciboPagamento = ({ pagamento, onClose }) => {
    if (!pagamento) return null;

    const dataFormatada = moment(pagamento.dataPagamento).format('HH:mm - DD/MM/YYYY');
    const valorExtenso = numeroPorExtenso(pagamento.valorPago);

    return (
        <div style={{ padding: '16px' }}>
            {/* Botões */}
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <Space size="middle">
                    <Button type="primary" icon={<FilePdfOutlined />} onClick={() => gerarPDF(pagamento)} size="large">
                        Gerar PDF
                    </Button>
                    <Button icon={<PrinterOutlined />} onClick={() => window.print()} size="large">
                        Imprimir
                    </Button>
                    {onClose && (
                        <Button icon={<CloseOutlined />} onClick={onClose} size="large">
                            Fechar
                        </Button>
                    )}
                </Space>
            </div>

            {/* Preview Original */}
            <div style={{
                maxWidth: '600px', margin: '0 auto 16px', border: '2px solid #000', borderRadius: 4,
                padding: 20, backgroundColor: '#fff', fontFamily: '"Courier New", monospace', fontSize: 12
            }}>
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: 8, marginBottom: 12 }}>
                    <img src={logoRecibo} alt="Logo" style={{ maxWidth: '100%', height: 'auto', maxHeight: 60 }} />
                </div>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', letterSpacing: 2 }}>RECIBO</div>
                    <div style={{ fontSize: 12 }}>Nº {pagamento.numeroRecibo}</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                    <tbody>
                        <tr><td style={{ fontWeight: 'bold', width: '28%', padding: '1px 0' }}>Data/Hora:</td><td>{dataFormatada}</td></tr>
                        <tr><td style={{ fontWeight: 'bold', padding: '1px 0' }}>Operador:</td><td>{pagamento.nomeOperador || pagamento.operador || '___________'}</td></tr>
                        <tr><td style={{ fontWeight: 'bold', padding: '1px 0' }}>Recebemos de:</td><td>{(pagamento.cliente || '').toUpperCase()}</td></tr>
                        <tr><td style={{ fontWeight: 'bold', padding: '1px 0' }}>BI/NUIT:</td><td>{pagamento.documento || pagamento.nuit || '__________'}</td></tr>
                        <tr><td style={{ fontWeight: 'bold', padding: '1px 0' }}>Forma Pag.:</td><td>{pagamento.formaPagamento}</td></tr>
                        <tr><td style={{ fontWeight: 'bold', padding: '1px 0' }}>Valor:</td><td style={{ fontWeight: 'bold', fontSize: 14 }}>{formatarMoeda(pagamento.valorPago)}</td></tr>
                        <tr><td colSpan={2} style={{ fontStyle: 'italic', fontSize: 10 }}>({valorExtenso})</td></tr>
                        <tr><td style={{ fontWeight: 'bold', padding: '1px 0' }}>Ref. Crédito:</td><td>Nº {pagamento.numeroCredito || pagamento.credito}</td></tr>
                    </tbody>
                </table>

                {/* Tabela Parcelas */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, border: '1px solid #000' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                            <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>Parcela(s)</th>
                            <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right' }}>Valor</th>
                            <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagamento.parcelasPagas?.length > 0 ? (
                            pagamento.parcelasPagas.map((p, i) => (
                                <tr key={i}>
                                    <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{p.numero}ª Prestação</td>
                                    <td style={{ border: '1px solid #ccc', padding: '2px 6px', textAlign: 'right' }}>{formatarMoeda(p.valorAlocado)}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Amortização</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Prestação</td>
                                <td style={{ border: '1px solid #ccc', padding: '2px 6px', textAlign: 'right' }}>{formatarMoeda(pagamento.valorPago)}</td>
                                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Amortização</td>
                            </tr>
                        )}
                        <tr style={{ fontWeight: 'bold', borderTop: '1px solid #000' }}>
                            <td style={{ padding: '2px 6px', textAlign: 'right' }}>Total:</td>
                            <td style={{ padding: '2px 6px', textAlign: 'right' }}>{formatarMoeda(pagamento.totalAlocado || pagamento.valorPago)}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ backgroundColor: '#f9f9f9', padding: '6px 10px', marginBottom: 8, borderRadius: 3 }}>
                    <strong>Saldo em Dívida:</strong> {formatarMoeda(pagamento.saldoDevedor || 0)}
                </div>
                {pagamento.troco > 0 && (
                    <div style={{ color: '#d46b08', marginBottom: 8 }}><strong>Troco:</strong> {formatarMoeda(pagamento.troco)}</div>
                )}
                <div style={{ marginTop: 24 }}><strong>Assinaturas:</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                    <div style={{ width: '40%', borderTop: '1px solid #000', paddingTop: 4, textAlign: 'center' }}>CAIXA</div>
                    <div style={{ width: '40%', borderTop: '1px solid #000', paddingTop: 4, textAlign: 'center' }}>CLIENTE</div>
                </div>
            </div>

            {/* Indicador da Cópia */}
            <div style={{
                maxWidth: '600px', margin: '0 auto', border: '1px dashed #ccc', borderRadius: 4,
                padding: 12, textAlign: 'center', color: '#999', fontSize: 12
            }}>
                ✂ Destaque aqui ✂<br />
                <small>O PDF gerado contém ORIGINAL + CÓPIA em uma única folha A4</small>
            </div>
        </div>
    );
};

export default ReciboPagamento;