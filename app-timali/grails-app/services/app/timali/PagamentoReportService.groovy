// grails-app/services/app/timali/PagamentoReportService.groovy
package app.timali

import grails.gorm.transactions.Transactional
import groovy.json.JsonOutput
import java.text.SimpleDateFormat

@Transactional
class PagamentoReportService {

    /**
     * Gera dados para o relatório de pagamentos por período
     */
    def gerarRelatorioPagamentos(Date dataInicio, Date dataFim) {
        // Ajustar dataFim para incluir o dia inteiro
        Calendar cal = Calendar.getInstance()
        cal.setTime(dataFim)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        Date dataFimAjustada = cal.getTime()

        // Buscar parcelas pagas no período
        def parcelasPagas = Parcela.createCriteria().list {
            eq('pago', true)
            between('dataPagamento', dataInicio, dataFimAjustada)
            order('dataPagamento', 'asc')
            credito {
                order('entidade', 'nome')
            }
        }

        // Buscar parcelas com vencimento no período (esperadas)
        def parcelasVencimento = Parcela.createCriteria().list {
            between('dataVencimento', dataInicio, dataFim)
            order('dataVencimento', 'asc')
            credito {
                order('entidade', 'nome')
            }
        }

        // Agrupar por crédito
        def creditosMap = [:]

        parcelasPagas.each { parcela ->
            def credito = parcela.credito
            def entidade = credito?.entidade

            if (!creditosMap[credito?.id]) {
                creditosMap[credito?.id] = [
                        creditoId: credito?.id,
                        creditoNumero: credito?.numero,
                        cliente: entidade?.nome,
                        nuit: entidade?.nuit,
                        telefone: entidade?.telefone ?: entidade?.telefone1 ?: entidade?.telefone2 ?: '',
                        documento: entidade?.numeroDeIdentificao ?: '',
                        valorTotalCredito: credito?.valorTotal ?: 0,
                        totalPagoCredito: credito?.totalPago ?: 0,
                        saldoDevedor: credito?.totalEmDivida ?: 0,
                        parcelasPagas: [],
                        totalPagoPeriodo: 0
                ]
            }

            def info = creditosMap[credito?.id]
            info.parcelasPagas << [
                    parcelaId: parcela.id,
                    numero: parcela.numero,
                    dataVencimento: parcela.dataVencimento,
                    dataPagamento: parcela.dataPagamento,
                    valorParcela: parcela.valorParcela,
                    valorPago: parcela.valorPago,
                    formaPagamento: parcela.formaPagamento,
                    comprovativo: parcela.comprovativo,
                    pagoNoPrazo: parcela.pagoNoPrazo
            ]
            info.totalPagoPeriodo += parcela.valorPago ?: 0
        }

        // Totais gerais
        BigDecimal totalPagoPeriodo = parcelasPagas.sum { it.valorPago ?: 0 } ?: 0
        BigDecimal totalPrevistoPeriodo = parcelasVencimento.sum { it.valorParcela ?: 0 } ?: 0

        // Contagem por forma de pagamento
        def totaisPorForma = [:]
        parcelasPagas.groupBy { it.formaPagamento }.each { forma, lista ->
            totaisPorForma[forma] = [
                    quantidade: lista.size(),
                    valorTotal: lista.sum { it.valorPago ?: 0 }
            ]
        }

        // Parcelas pagas no prazo vs com atraso
        def pagasNoPrazo = parcelasPagas.findAll { it.pagoNoPrazo }
        def pagasComAtraso = parcelasPagas.findAll { !it.pagoNoPrazo }

        def resultado = [
                periodo: [
                        dataInicio: dataInicio.format('dd/MM/yyyy'),
                        dataFim: dataFim.format('dd/MM/yyyy')
                ],
                resumo: [
                        totalParcelasPagas: parcelasPagas.size(),
                        totalParcelasVencidas: parcelasVencimento.size(),
                        totalPagoPeriodo: totalPagoPeriodo,
                        totalPrevistoPeriodo: totalPrevistoPeriodo,
                        totalPagasNoPrazo: pagasNoPrazo.size(),
                        totalPagasComAtraso: pagasComAtraso.size(),
                        valorPagasNoPrazo: pagasNoPrazo.sum { it.valorPago ?: 0 } ?: 0,
                        valorPagasComAtraso: pagasComAtraso.sum { it.valorPago ?: 0 } ?: 0,
                        totaisPorForma: totaisPorForma
                ],
                creditos: creditosMap.values().sort { it.cliente }
        ]

        return resultado
    }
}