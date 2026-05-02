// src/components/caixa/RelatorioPagamentosPDF.jsx
import React from 'react';
import { Button, message } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import moment from 'moment';
import jsPDF from 'jspdf';
import creditoService from '../../services/creditoService';
import logoRecibo from '../../assets/images/logo.png';

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency', currency: 'MZN', minimumFractionDigits: 2
    }).format(valor || 0);
};

const gerarPDF = async (dataInicio, dataFim) => {
    try {
        message.loading({ content: 'Gerando relatório...', key: 'relatorio' });

        const dados = await creditoService.relatorioPagamentos(dataInicio, dataFim);

        if (!dados || !dados.parcelas || dados.parcelas.length === 0) {
            message.warning({ content: 'Nenhuma parcela com vencimento no período', key: 'relatorio' });
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = 297;
        const pageH = 210;
        const ml = 8;
        const mr = 8;

        let y = 5;

        // ============================================
        // CABEÇALHO - Apenas a imagem/logo
        // ============================================
        try {
            doc.addImage(logoRecibo, 'PNG', pageW / 2 - 40, y, 80, 17);
            y += 19;
        } catch (e) {
            y += 5;
        }

        // Linha separadora
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(ml, y, pageW - mr, y);
        y += 4;

        // ============================================
        // TÍTULO DO RELATÓRIO
        // ============================================
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('RELATÓRIO DE PARCELAS POR VENCIMENTO', pageW / 2, y, { align: 'center' });
        y += 5;

        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.text(`Período de Vencimento: ${dados.periodo?.dataInicio} a ${dados.periodo?.dataFim}`, ml, y);
        doc.text(`Gerado em: ${moment().format('DD/MM/YYYY HH:mm')}`, pageW - mr, y, { align: 'right' });
        y += 7;

        // ============================================
        // RESUMO
        // ============================================
        const parcelasPagas = dados.parcelas.filter(p => p.pago);
        const parcelasPendentes = dados.parcelas.filter(p => !p.pago);
        const valorTotalPeriodo = dados.parcelas.reduce((s, p) => s + (p.valorParcela || 0), 0);
        const valorPagoPeriodo = parcelasPagas.reduce((s, p) => s + (p.valorPago || 0), 0);

        doc.setFillColor(245, 245, 245);
        doc.rect(ml, y, pageW - ml - mr, 7, 'F');

        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`Total: ${dados.totalParcelas} parcelas`, ml + 2, y + 5);
        doc.text(`Pagas: ${parcelasPagas.length}`, ml + 50, y + 5);
        doc.text(`Pendentes: ${parcelasPendentes.length}`, ml + 78, y + 5);
        doc.text(`Valor Período: ${formatarMoeda(valorTotalPeriodo)}`, ml + 115, y + 5);
        doc.text(`Pago: ${formatarMoeda(valorPagoPeriodo)}`, ml + 205, y + 5);
        y += 9;

        // ============================================
        // TABELA
        // ============================================
        const colunas = [
            { x: ml, w: 20, title: 'Vencimento' },
            { x: ml + 20, w: 10, title: 'Nº' },
            { x: ml + 30, w: 50, title: 'Cliente' },
            { x: ml + 80, w: 25, title: 'Telefone' },
            { x: ml + 105, w: 28, title: 'Crédito' },
            { x: ml + 133, w: 24, title: 'Valor Parcela' },
            { x: ml + 157, w: 22, title: 'Valor Pago' },
            { x: ml + 179, w: 22, title: 'Saldo Dev.' },
            { x: ml + 201, w: 22, title: 'Data Pag.' },
            { x: ml + 223, w: 22, title: 'Forma' },
            { x: ml + 245, w: 20, title: 'Status' },
        ];

        const desenharCabecalhoTabela = (yPos) => {
            doc.setFillColor(50, 50, 50);
            colunas.forEach(col => {
                doc.rect(col.x, yPos, col.w, 5.5, 'F');
            });

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(5.5);
            doc.setFont(undefined, 'bold');
            colunas.forEach(col => {
                doc.text(col.title, col.x + 0.5, yPos + 3.8);
            });

            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');

            return yPos + 5.5;
        };

        y = desenharCabecalhoTabela(y);

        // Dados
        doc.setFontSize(5.5);
        dados.parcelas.forEach((p, index) => {
            if (y > pageH - 15) {
                doc.addPage();
                y = 10;
                y = desenharCabecalhoTabela(y);
            }

            const bgColor = index % 2 === 0 ? 252 : 245;
            doc.setFillColor(bgColor, bgColor, bgColor);
            colunas.forEach(col => doc.rect(col.x, y, col.w, 4.2, 'F'));

            doc.setTextColor(0, 0, 0);
            doc.text(p.dataVencimento || '', colunas[0].x + 0.5, y + 3);
            doc.text(`#${p.numeroParcela || ''}`, colunas[1].x + 0.5, y + 3);
            doc.text((p.clienteNome || '').substring(0, 25), colunas[2].x + 0.5, y + 3);
            doc.text((p.clienteTelefone || '').substring(0, 13), colunas[3].x + 0.5, y + 3);
            doc.text((p.creditoNumero || '').substring(0, 15), colunas[4].x + 0.5, y + 3);
            doc.text(formatarMoeda(p.valorParcela || 0), colunas[5].x + colunas[5].w - 0.5, y + 3, { align: 'right' });

            if (p.pago) {
                doc.setTextColor(0, 120, 0);
            } else {
                doc.setTextColor(180, 0, 0);
            }
            doc.text(formatarMoeda(p.valorPago || 0), colunas[6].x + colunas[6].w - 0.5, y + 3, { align: 'right' });
            doc.setTextColor(0, 0, 0);

            doc.text(formatarMoeda(p.saldoDevedor || 0), colunas[7].x + colunas[7].w - 0.5, y + 3, { align: 'right' });
            doc.text(p.dataPagamento?.substring(0, 10) || '-', colunas[8].x + 0.5, y + 3);
            doc.text((p.formaPagamento || '-').substring(0, 12), colunas[9].x + 0.5, y + 3);

            if (p.pago) {
                if (p.pagoNoPrazo) {
                    doc.setTextColor(0, 130, 0);
                    doc.text('No Prazo', colunas[10].x + 0.5, y + 3);
                } else {
                    doc.setTextColor(200, 150, 0);
                    doc.text('c/ Atraso', colunas[10].x + 0.5, y + 3);
                }
            } else {
                doc.setTextColor(200, 0, 0);
                doc.text('Pendente', colunas[10].x + 0.5, y + 3);
            }
            doc.setTextColor(0, 0, 0);

            y += 4.2;
        });

        // Totais
        y += 2;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(ml, y, pageW - mr, y);
        y += 4;

        doc.setFont(undefined, 'bold');
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text(`TOTAL: ${dados.totalParcelas} parcelas | Pagas: ${parcelasPagas.length} | Pendentes: ${parcelasPendentes.length}`, ml, y);
        doc.text(`Valor Total: ${formatarMoeda(valorTotalPeriodo)} | Pago: ${formatarMoeda(valorPagoPeriodo)}`, ml + 133, y);

        // Rodapé
        doc.setFontSize(5.5);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('Sistema de Gestão de Microcrédito - Relatório de Parcelas por Vencimento - ' + moment().format('DD/MM/YYYY HH:mm'), pageW / 2, pageH - 4, { align: 'center' });

        const fileName = `Relatorio_Vencimentos_${dataInicio}_a_${dataFim}.pdf`;
        doc.save(fileName);
        message.success({ content: 'Relatório gerado com sucesso!', key: 'relatorio' });

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        message.error({ content: 'Erro ao gerar relatório', key: 'relatorio' });
    }
};

const RelatorioPagamentosPDF = ({ dataInicio, dataFim, children }) => {
    const handleGerar = () => {
        if (!dataInicio || !dataFim) {
            message.warning('Selecione um período');
            return;
        }
        gerarPDF(dataInicio, dataFim);
    };

    if (children) {
        return React.cloneElement(children, { onClick: handleGerar });
    }

    return (
        <Button type="primary" icon={<FilePdfOutlined />} onClick={handleGerar} size="small">
            PDF Vencimentos
        </Button>
    );
};

export default RelatorioPagamentosPDF;