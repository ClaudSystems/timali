// grails-app/services/app/timali/DocumentoService.groovy
package app.timali

import grails.gorm.transactions.Transactional
import org.springframework.web.multipart.MultipartFile

import java.text.SimpleDateFormat

@Transactional
class DocumentoService {

    StorageService storageService

    /**
     * Upload de documento
     */

    Documento upload(Long entidadeId, MultipartFile arquivo, String tipo, String descricao, Usuario usuario) {
        Entidade entidade = Entidade.get(entidadeId)
        if (!entidade) throw new RuntimeException("Entidade não encontrada")

        String caminho = storageService.salvar(arquivo.bytes, arquivo.originalFilename)
        String hash = storageService.calcularHash(arquivo.bytes)

        Documento doc = new Documento(
                entidade: entidade,
                tipo: tipo,
                nomeOriginal: arquivo.originalFilename,
                caminho: caminho,
                extensao: extrairExtensao(arquivo.originalFilename),
                tamanho: arquivo.size,
                hash: hash,
                descricao: descricao,
                dataUpload: new Date(),
                criadoPor: usuario  // 👈 Deve ser um objeto Usuario, não null
        )

        doc.save(flush: true, failOnError: true)
        return doc
    }

        /**
     * Download de documento
     */
    Map download(Long documentoId) {
        Documento doc = Documento.get(documentoId)
        if (!doc) return null

        byte[] conteudo = storageService.recuperar(doc.caminho)
        if (!conteudo) return null

        return [
                conteudo: conteudo,
                nome: doc.nomeOriginal,
                tipo: doc.tipo,
                extensao: doc.extensao
        ]
    }

    /**
     * Listar documentos de uma entidade
     */
    List<Documento> listarPorEntidade(Long entidadeId) {
        return Documento.where {
            entidade.id == entidadeId
        }.list(sort: 'dataUpload', order: 'desc')
    }

    /**
     * Excluir documento
     */
    void excluir(Long documentoId) {
        Documento doc = Documento.get(documentoId)
        if (doc) {
            storageService.remover(doc.caminho)
            doc.delete(flush: true)
        }
    }

    /**
     * Formatar para JSON
     */
    Map formatarParaJson(Documento doc) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")

        [
                id: doc.id,
                entidadeId: doc.entidade?.id,
                tipo: doc.tipo,
                nomeOriginal: doc.nomeOriginal,
                extensao: doc.extensao,
                tamanho: doc.tamanho,
                descricao: doc.descricao,
                dataUpload: doc.dataUpload ? sdf.format(doc.dataUpload) : null,
                hash: doc.hash,
                criadoPor: doc.criadoPor ? [id: doc.criadoPor.id, username: doc.criadoPor.username] : null,  // 👈 Retorna um Map ou null
                version: doc.version
        ]
    }

    private String extrairExtensao(String nomeArquivo) {
        if (!nomeArquivo?.contains('.')) return null
        return nomeArquivo.substring(nomeArquivo.lastIndexOf('.') + 1).toLowerCase()
    }
}