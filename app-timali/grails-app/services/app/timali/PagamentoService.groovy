package app.timali

import grails.gorm.transactions.Transactional
import grails.validation.ValidationException
import groovy.util.logging.Slf4j
import java.math.RoundingMode

@Slf4j
@Transactional
class PagamentoService {

    CreditoService creditoService

    /**
     * Busca créditos ativos por nome/NUIT do cliente
     */
    List<Credito> buscarCreditosPorCliente(String query) {
        if (!query || query.length() < 2) {
            return []
        }

        def creditos = Credito.createCriteria().list {
            or {
                entidade {
                    ilike('nome', "%${query}%")
                }
                entidade {
                    ilike('nuit', "%${query}%")
                }
                ilike('numero', "%${query}%")
            }
            eq('ativo', true)
            or {
                eq('status', StatusCredito.ATIVO)
                eq('status', StatusCredito.EM_ATRASO)
            }
            order('dataEmissao', 'desc')
            maxResults(20)
        }

        return creditos
    }

    /**
     * Busca parcelas pendentes de um crédito
     */
    List<Parcela> buscarParcelasPendentes(Long creditoId) {
        def credito = Credito.get(creditoId)
        if (!credito) {
            throw new RuntimeException("Crédito não encontrado")
        }

        def parcelas = Parcela.createCriteria().list {
            eq('credito', credito)
            or {
                eq('pago', false)
                isNull('pago')
            }
            order('numero', 'asc')
        }

        return parcelas
    }

    /**
     * Calcula valores de mora para uma parcela específica
     */
    def calcularValoresMora(Long parcelaId) {
        def parcela = Parcela.get(parcelaId)
        if (!parcela) {
            throw new RuntimeException("Parcela não encontrada")
        }

        def credito = parcela.credito
        Date hoje = new Date()

        def resultado = [
                parcelaId: parcela.id,
                numero: parcela.numero,
                valorParcela: parcela.valorParcela,
                valorAmortizacao: parcela.valorAmortizacao,
                valorJuros: parcela.valorJuros,
                valorMulta: parcela.valorMulta,
                valorJurosDemora: parcela.valorJurosDemora,
                saldoDevedor: parcela.saldoDevedor,
                total: parcela.valorParcela,
                diasAtraso: 0,
                emMora: false
        ]

        // Se a parcela está vencida e não paga
        if (parcela.dataVencimento && parcela.dataVencimento < hoje && !parcela.pago) {
            long diferencaMillis = hoje.time - parcela.dataVencimento.time
            int diasAtraso = (diferencaMillis / (1000 * 60 * 60 * 24)) as int

            resultado.diasAtraso = diasAtraso
            resultado.emMora = true

            // Calcular juros de demora se configurado no crédito
            if (credito.percentualJurosDeDemora > 0) {
                BigDecimal jurosDemoraCalculado = (parcela.valorParcela * credito.percentualJurosDeDemora / 100 * diasAtraso / 30)
                        .setScale(2, RoundingMode.HALF_UP)
                resultado.valorJurosDemora = jurosDemoraCalculado
            }

            // Total com mora
            resultado.total = (parcela.valorParcela +
                    (resultado.valorJurosDemora ?: 0.0) +
                    (resultado.valorMulta ?: 0.0))
                    .setScale(2, RoundingMode.HALF_UP)

            // Atualizar dias de atraso na parcela se necessário
            if (parcela.diasAtraso != diasAtraso) {
                parcela.diasAtraso = diasAtraso
                parcela.emMora = true
                parcela.status = StatusParcela.VENCIDA
                parcela.save(flush: true)
            }
        }

        return resultado
    }

    /**
     * Registra um novo pagamento
     */
    Pagamento registrarPagamento(RegistroPagamentoCommand cmd) {
        Credito credito = Credito.get(cmd.creditoId)
        if (!credito) {
            throw new ValidationException("Crédito não encontrado", null)
        }

        Pagamento pagamento = new Pagamento()
        pagamento.credito = credito
        pagamento.entidade = credito.entidade
        pagamento.dataPagamento = cmd.dataPagamento ?: new Date()
        pagamento.formaPagamento = cmd.formaPagamento
        pagamento.referenciaPagamento = cmd.referenciaPagamento
        pagamento.valorPago = cmd.valorPago
        pagamento.valorParcela = cmd.valorParcela ?: 0.0
        pagamento.valorJuros = cmd.valorJuros ?: 0.0
        pagamento.valorJurosDemora = cmd.valorJurosDemora ?: 0.0
        pagamento.valorMulta = cmd.valorMulta ?: 0.0
        pagamento.troco = cmd.troco ?: 0.0
        pagamento.descricao = cmd.descricao
        pagamento.numeroRecibo = gerarNumeroRecibo()

        // Processar parcelas
        if (cmd.parcelas) {
            processarParcelas(pagamento, cmd.parcelas)
        }

        if (!pagamento.save(flush: true, failOnError: true)) {
            throw new ValidationException("Erro ao salvar pagamento", pagamento.errors)
        }

        // ***** NOVO: Criar ou atualizar diário automaticamente *****
        try {
            log.info("Verificando/criando diário para pagamento na data: ${pagamento.dataPagamento}")
            Diario diario = diarioCaixaService.encontrarOuCriarDiario(pagamento.dataPagamento)
            diarioCaixaService.atualizarTotaisDiario(diario)
            log.info("Diário atualizado com pagamento: ${pagamento.numeroRecibo}")
        } catch (Exception e) {
            log.error("Erro ao atualizar diário: ${e.message}", e)
            // Não impede o pagamento, apenas loga o erro
        }

        return pagamento
    }

    /**
     * Gera número de recibo sequencial
     */
    private String gerarNumeroRecibo() {
        def sdf = new java.text.SimpleDateFormat("yyyyMMdd")
        String dataHoje = sdf.format(new Date())

        def ultimoHoje = Pagamento.createCriteria().list {
            like('numeroRecibo', "REC-${dataHoje}-%")
            order('id', 'desc')
            maxResults(1)
        }?.first()

        int sequencia = 1
        if (ultimoHoje) {
            String[] partes = ultimoHoje.numeroRecibo.split('-')
            if (partes.length == 3) {
                sequencia = (partes[2] as int) + 1
            }
        }

        return "REC-${dataHoje}-${String.format('%04d', sequencia)}"
    }

    /**
     * Lista pagamentos do dia
     */
    List<Pagamento> listarPagamentosDoDia(Date data) {
        Date inicio = data.clearTime()
        Date fim = inicio + 1

        return Pagamento.createCriteria().list {
            between('dataPagamento', inicio, fim)
            order('dataPagamento', 'desc')
            maxResults(100)
        }
    }

    /**
     * Resumo do caixa do dia
     */
    def resumoCaixa(Date data) {
        Date inicio = data.clearTime()
        Date fim = inicio + 1

        def pagamentos = Pagamento.createCriteria().list {
            between('dataPagamento', inicio, fim)
        }

        def totaisPorForma = [:]
        pagamentos.groupBy { it.formaPagamento }.each { forma, lista ->
            totaisPorForma[forma] = lista.sum { it.valorPago }?.setScale(2, RoundingMode.HALF_UP) ?: 0.0
        }

        return [
                data: data.format('yyyy-MM-dd'),
                totalPagamentos: pagamentos.size(),
                valorTotal: pagamentos.sum { it.valorPago }?.setScale(2, RoundingMode.HALF_UP) ?: 0.0,
                totaisPorForma: totaisPorForma,
                totalParcelas: pagamentos.sum { it.valorParcela }?.setScale(2, RoundingMode.HALF_UP) ?: 0.0,
                totalJuros: pagamentos.sum { it.valorJuros + it.valorJurosDemora }?.setScale(2, RoundingMode.HALF_UP) ?: 0.0,
                totalMultas: pagamentos.sum { it.valorMulta }?.setScale(2, RoundingMode.HALF_UP) ?: 0.0,
                totalTroco: pagamentos.sum { it.troco }?.setScale(2, RoundingMode.HALF_UP) ?: 0.0
        ]
    }
}