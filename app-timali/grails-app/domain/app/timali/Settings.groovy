package app.timali

import grails.compiler.GrailsCompileStatic
import grails.rest.Resource
import grails.gorm.transactions.Transactional

@GrailsCompileStatic
@Resource(uri = '/api/settings', formats = ['json'], readOnly = false)
class Settings {

    private static final long serialVersionUID = 1

    String nome
    Boolean permitirDesembolsoComDivida = false
    String conta1
    String conta2
    String conta3
    Boolean pagamentosEmOrdem = false
    String rodaPePlanoDePagamento
    String nbPlanoDePagamento
    Boolean ignorarValorPagoNoPrazo = false
    Boolean pagarEmSequencia = false
    Boolean alterarDataPagamento = false

    static constraints = {
        nome nullable: false, blank: false, unique: true
        permitirDesembolsoComDivida nullable: true
        conta1 nullable: true
        conta2 nullable: true
        conta3 nullable: true
        pagamentosEmOrdem nullable: true
        rodaPePlanoDePagamento nullable: true, maxSize: 5000
        nbPlanoDePagamento nullable: true, maxSize: 5000
        ignorarValorPagoNoPrazo nullable: true
        pagarEmSequencia nullable: true
        alterarDataPagamento nullable: true
    }

    static mapping = {
        table 'settings'
        version false
        nome column: 'nome'
        permitirDesembolsoComDivida column: 'permitir_desembolso_com_divida'
        conta1 column: 'conta1'
        conta2 column: 'conta2'
        conta3 column: 'conta3'
        pagamentosEmOrdem column: 'pagamentos_em_ordem'
        rodaPePlanoDePagamento column: 'roda_pe_plano_de_pagamento', type: 'text'
        nbPlanoDePagamento column: 'nb_plano_de_pagamento', type: 'text'
        ignorarValorPagoNoPrazo column: 'ignorar_valor_pago_no_prazo'
        pagarEmSequencia column: 'pagar_em_sequencia'
        alterarDataPagamento column: 'alterar_data_pagamento'
        cache true
    }

    // Método para obter a configuração única (apenas leitura, sem transação)
    static Settings getInstance() {
        Settings settings = Settings.first()
        if (!settings) {
            // Não salvar aqui - apenas retornar null e deixar o Bootstrap criar
            return null
        }
        return settings
    }
}