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
        log.info("💰 Registrando pagamento - Crédito: ${cmd.creditoId}, Valor: ${cmd.valorPago}")

        def usuario = Usuario.findByUsername(cmd.username)
        if (!usuario) {
            throw new ValidationException("Usuário não encontrado", null)
        }

        def credito = Credito.get(cmd.creditoId)
        if (!credito) {
            throw new ValidationException("Crédito não encontrado", null)
        }

        def entidade = credito.entidade
        Parcela parcela = null

        if (cmd.parcelaId) {
            parcela = Parcela.get(cmd.parcelaId)
            if (!parcela) {
                throw new ValidationException("Parcela não encontrada", null)
            }
            if (parcela.pago && cmd.valorParcela > 0) {
                throw new ValidationException("Esta parcela já foi paga", null)
            }
        }

        // Criar o pagamento
        Pagamento pagamento = new Pagamento()
        pagamento.credito = credito
        pagamento.parcela = parcela
        pagamento.entidade = entidade
        pagamento.usuario = usuario

        pagamento.valorPago = cmd.valorPago.setScale(2, RoundingMode.HALF_UP)
        pagamento.valorParcela = cmd.valorParcela?.setScale(2, RoundingMode.HALF_UP) ?: 0.0
        pagamento.valorJuros = cmd.valorJuros?.setScale(2, RoundingMode.HALF_UP) ?: 0.0
        pagamento.valorMulta = cmd.valorMulta?.setScale(2, RoundingMode.HALF_UP) ?: 0.0
        pagamento.valorJurosDemora = cmd.valorJurosDemora?.setScale(2, RoundingMode.HALF_UP) ?: 0.0

        // Calcular troco
        BigDecimal totalCobrado = pagamento.valorParcela + pagamento.valorJuros + pagamento.valorMulta + pagamento.valorJurosDemora
        pagamento.troco = (pagamento.valorPago - totalCobrado).max(0.0).setScale(2, RoundingMode.HALF_UP)

        pagamento.formaPagamento = cmd.formaPagamento
        pagamento.descricao = cmd.descricao
        pagamento.referenciaPagamento = cmd.referenciaPagamento
        pagamento.dataPagamento = cmd.dataPagamento ?: new Date()
        pagamento.numeroRecibo = gerarNumeroRecibo()
        pagamento.criadoPor = cmd.username

        if (!pagamento.save(flush: true, failOnError: true)) {
            throw new ValidationException("Erro ao salvar pagamento", pagamento.errors)
        }

        // Se tem parcela, atualizar usando o CreditoService
        if (parcela && pagamento.valorParcela > 0) {
            try {
                creditoService.registrarPagamento(
                        parcela,
                        pagamento.valorParcela,
                        cmd.formaPagamento,
                        pagamento.numeroRecibo
                )
                log.info("✅ Parcela #${parcela.numero} atualizada com sucesso")
            } catch (Exception e) {
                log.error("Erro ao atualizar parcela: ${e.message}")
            }
        } else if (!parcela) {
            // Pagamento sem parcela específica
            credito.totalPago = (credito.totalPago ?: 0.0) + pagamento.valorPago
            credito.totalEmDivida = (credito.totalPrevisto ?: credito.valorTotal) - credito.totalPago
            credito.totalEmDivida = credito.totalEmDivida.max(0.0)

            if (credito.totalEmDivida <= 0) {
                credito.quitado = true
                credito.status = StatusCredito.QUITADO
                credito.ativo = false
            }

            credito.save(flush: true)
        }

        // Recalcular totais do crédito
        creditoService.recalcularTotais(credito)

        log.info("✅ Pagamento registrado: ${pagamento.numeroRecibo} - ${pagamento.valorPago} MZN")

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