// grails-app/domain/app/timali/Documento.groovy
package app.timali

import java.text.SimpleDateFormat

class Documento {

    Entidade entidade
    String tipo  // BI, PASSAPORTE, FOTO, CONTRATO, OUTRO
    String nomeOriginal  // nome original do arquivo
    String caminho  // caminho relativo no storage
    String extensao  // pdf, jpg, png, etc.
    Long tamanho  // tamanho em bytes
    String hash  // SHA-256 do arquivo
    String descricao  // descrição opcional

    Date dataUpload = new Date()
    Usuario criadoPor

    static transients = ['dataUploadFormatada']

    static constraints = {
        entidade nullable: false
        tipo nullable: false, inList: ['BI', 'PASSAPORTE', 'FOTO', 'CONTRATO', 'OUTRO']
        nomeOriginal nullable: false, maxSize: 255
        caminho nullable: false, maxSize: 500
        extensao nullable: true, maxSize: 10
        tamanho nullable: true
        hash nullable: true, maxSize: 64
        descricao nullable: true, maxSize: 500
        dataUpload nullable: false
        criadoPor nullable: true, bindable: false  // 👈 bindable: false AQUI
    }

    static mapping = {
        table 'documento'
        entidade column: 'entidade_id', index: 'idx_documento_entidade'
        criadoPor column: 'criado_por_id'
        dataUpload column: 'data_upload'
        nomeOriginal column: 'nome_original'
        sort dataUpload: 'desc'
    }

    static belongsTo = [entidade: Entidade]

    String toString() {
        "${tipo} - ${nomeOriginal}"
    }

    String getDataUploadFormatada() {
        dataUpload ? new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(dataUpload) : null
    }

    def beforeInsert() {
        if (!dataUpload) {
            dataUpload = new Date()
        }
    }
}