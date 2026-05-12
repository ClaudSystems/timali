// grails-app/services/app/timali/StorageService.groovy
package app.timali

import grails.core.GrailsApplication
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec
import java.security.MessageDigest

class StorageService {

    GrailsApplication grailsApplication

    String storagePath

    @javax.annotation.PostConstruct
    void init() {
        // Criar pasta de storage se não existir
        storagePath = grailsApplication.config.getProperty('timali.storage.path', String, 'data/documents')
        new File(storagePath).mkdirs()
    }

    /**
     * Salva arquivo encriptado no disco
     */
    String salvar(byte[] arquivo, String nomeArquivo) {
        String nomeUnico = gerarNomeUnico(nomeArquivo)
        File destino = new File(storagePath, nomeUnico)

        // Encriptar antes de salvar
        byte[] encriptado = encriptar(arquivo)
        destino.bytes = encriptado

        return nomeUnico
    }

    /**
     * Recupera arquivo desencriptado
     */
    byte[] recuperar(String caminho) {
        File arquivo = new File(storagePath, caminho)
        if (!arquivo.exists()) return null
        return desencriptar(arquivo.bytes)
    }

    /**
     * Remove arquivo do disco
     */
    boolean remover(String caminho) {
        File arquivo = new File(storagePath, caminho)
        return arquivo.delete()
    }

    /**
     * Calcula hash SHA-256 do arquivo
     */
    String calcularHash(byte[] arquivo) {
        MessageDigest digest = MessageDigest.getInstance("SHA-256")
        byte[] hash = digest.digest(arquivo)
        return hash.collect { String.format('%02x', it) }.join()
    }

    /**
     * Gera nome único para o arquivo
     */
    private String gerarNomeUnico(String nomeOriginal) {
        String extensao = nomeOriginal.contains('.') ?
                nomeOriginal.substring(nomeOriginal.lastIndexOf('.')) : ''
        return UUID.randomUUID().toString() + extensao
    }

    /**
     * Encripta usando AES-256
     */
    private byte[] encriptar(byte[] dados) {
        String chave = grailsApplication.config.getProperty('timali.storage.encryptionKey', String, 'TimaliSecretKey12')
        SecretKeySpec keySpec = new SecretKeySpec(chave.padRight(32).take(32).bytes, "AES")
        Cipher cipher = Cipher.getInstance("AES")
        cipher.init(Cipher.ENCRYPT_MODE, keySpec)
        return cipher.doFinal(dados)
    }

    /**
     * Desencripta usando AES-256
     */
    private byte[] desencriptar(byte[] dados) {
        String chave = grailsApplication.config.getProperty('timali.storage.encryptionKey', String, 'TimaliSecretKey12')
        SecretKeySpec keySpec = new SecretKeySpec(chave.padRight(32).take(32).bytes, "AES")
        Cipher cipher = Cipher.getInstance("AES")
        cipher.init(Cipher.DECRYPT_MODE, keySpec)
        return cipher.doFinal(dados)
    }
}