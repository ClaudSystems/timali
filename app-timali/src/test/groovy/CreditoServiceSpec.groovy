import grails.testing.services.ServiceUnitTest
import grails.testing.gorm.DomainUnitTest
import spock.lang.Specification
import app.timali.*

class CreditoServiceSpec extends Specification
        implements ServiceUnitTest<CreditoService>, DomainUnitTest<DefinicaoCredito> {

    void setup() {
        // Regista as domain classes adicionais que o teste vai usar
        mockDomains(Feriado, Credito, Parcela, Entidade, Usuario)
    }

    private Entidade createEntidade() {
        new Entidade(nome: "Entidade Teste").save(flush: true, validate: false)
    }

    private Usuario createUsuario() {
        new Usuario(username: "userTeste").save(flush: true, validate: false)
    }

    void "ajusta parcela semanal que cai em feriado"() {
        given:
        def entidade = createEntidade()
        def usuario = createUsuario()

        DefinicaoCredito defCred = new DefinicaoCredito(
                numeroDePrestacoes: 2,
                periodicidade: Periodicidade.SEMANAL,
                excluirDomingos: true,
                excluirSabados: false,
                percentualDeJuros: 0.0G
        ).save(flush: true)

        Calendar cal = Calendar.getInstance()
        cal.setTime(new Date())
        cal.add(Calendar.WEEK_OF_YEAR, 1)
        Date feriadoDate = cal.time

        new Feriado(
                nome: "Teste",
                dataCompleta: feriadoDate,
                tipo: TipoFeriado.MOVEL,
                abrangencia: TipoAbrangencia.NACIONAL,
                ativo: true
        ).save(flush: true)

        Credito credito = new Credito(
                entidade: entidade,
                usuario: usuario,
                definicaoCredito: defCred,
                valorConcedido: 100.00G,
                dataEmissao: new Date()
        ).save(flush: true)

        // sanity check: garantir que salvou
        assert credito?.id

        when:
        service.gerarParcelas(credito)
        credito = Credito.get(credito.id) // recarrega com parcelas

        then:
        credito.parcelas != null
        credito.parcelas.size() == 2
        credito.parcelas[0].dataVencimento != feriadoDate
    }

    void "credito diario estende prazo quando ajustado"() {
        given:
        def entidade = createEntidade()
        def usuario = createUsuario()

        DefinicaoCredito defCred = new DefinicaoCredito(
                numeroDePrestacoes: 3,
                periodicidade: Periodicidade.DIARIO,
                excluirDomingos: true,
                excluirSabados: false,
                percentualDeJuros: 0.0G
        ).save(flush: true)

        // encontra um domingo futuro para forçar ajuste
        Calendar cal = Calendar.getInstance()
        cal.setTime(new Date())
        while (cal.get(Calendar.DAY_OF_WEEK) != Calendar.SUNDAY) {
            cal.add(Calendar.DAY_OF_MONTH, 1)
        }
        Date domingo = cal.time

        new Feriado(
                nome: "DomingoTeste",
                dataCompleta: domingo,
                tipo: TipoFeriado.MOVEL,
                abrangencia: TipoAbrangencia.NACIONAL,
                ativo: true
        ).save(flush: true)

        Credito credito = new Credito(
                entidade: entidade,
                usuario: usuario,
                definicaoCredito: defCred,
                valorConcedido: 300.00G,
                dataEmissao: new Date()
        ).save(flush: true)

        assert credito?.id

        when:
        service.gerarParcelas(credito)
        credito = Credito.get(credito.id)

        then:
        credito.parcelas != null
        credito.parcelas.size() == 3
        credito.dataValidade != null
        credito.dataValidade.after(credito.dataEmissao)
    }
}
