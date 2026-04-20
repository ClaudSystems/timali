package app.timali

import grails.rest.*
import grails.converters.*

class EntidadeController extends RestfulController<Entidade> {
    static responseFormats = ['json', 'xml']
    
    EntidadeController() {
        super(Entidade)
    }
}
