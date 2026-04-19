package app.timali


import grails.rest.RestfulController
import grails.compiler.GrailsCompileStatic

@GrailsCompileStatic
class ProdutoController extends RestfulController<Produto> {
    ProdutoController() {
        super(Produto)
    }
}
