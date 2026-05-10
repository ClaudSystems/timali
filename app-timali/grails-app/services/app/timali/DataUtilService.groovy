// grails-app/services/app/timali/DataUtilService.groovy
package app.timali

import groovy.util.logging.Slf4j
import java.text.SimpleDateFormat

@Slf4j
class DataUtilService {

    /**
     * Converte uma string de data para Date usando o formato yyyy-MM-dd
     * @param dateStr - String no formato yyyy-MM-dd
     * @param defaultValue - Valor padrão se a string for nula/vazia
     * @return Date parseada ou defaultValue
     */
    Date parseData(String dateStr, Date defaultValue = new Date()) {
        if (!dateStr) return defaultValue
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd")
            sdf.setLenient(false)
            return sdf.parse(dateStr)
        } catch (Exception e) {
            log.warn("Erro ao parsear data '${dateStr}': ${e.message}")
            return defaultValue
        }
    }

    /**
     * Parse de data com formato personalizado
     * @param dateStr - String da data
     * @param format - Formato (ex: yyyy-MM-dd, dd/MM/yyyy)
     * @param defaultValue - Valor padrão
     */
    Date parseData(String dateStr, String format, Date defaultValue = new Date()) {
        if (!dateStr) return defaultValue
        try {
            SimpleDateFormat sdf = new SimpleDateFormat(format)
            sdf.setLenient(false)
            return sdf.parse(dateStr)
        } catch (Exception e) {
            log.warn("Erro ao parsear data '${dateStr}' com formato '${format}': ${e.message}")
            return defaultValue
        }
    }

    /**
     * Extrai dataInicio e dataFim dos params (padrão: últimos 30 dias)
     * @param params - Map com dataInicio e dataFim
     * @return Map com [dataInicio: Date, dataFim: Date]
     */
    Map<String, Date> extrairPeriodo(Map params) {
        Date hoje = new Date()
        Date dataInicio = parseData(params.dataInicio as String, hoje - 30)
        Date dataFim = parseData(params.dataFim as String, hoje)

        return [dataInicio: dataInicio, dataFim: dataFim]
    }

    /**
     * Extrai dataInicio e dataFim com validação e retorno de erro
     * @param params - Map com dataInicio e dataFim
     * @return Map com [dataInicio, dataFim, erro] - se erro != null, use para render
     */
    Map extrairPeriodoValidado(Map params) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd")
        sdf.setLenient(false)

        Date hoje = new Date()
        Date dataInicio, dataFim

        try {
            dataInicio = params.dataInicio ? sdf.parse(params.dataInicio as String) : (hoje - 30)
            dataFim = params.dataFim ? sdf.parse(params.dataFim as String) : hoje
            return [dataInicio: dataInicio, dataFim: dataFim, erro: null]
        } catch (Exception e) {
            return [dataInicio: null, dataFim: null, erro: "Formato de data inválido. Use yyyy-MM-dd"]
        }
    }

    /**
     * Formata uma Date para String
     * @param date - Data
     * @param format - Formato desejado (padrão: dd/MM/yyyy)
     */
    String formatar(Date date, String format = "dd/MM/yyyy") {
        if (!date) return ""
        try {
            SimpleDateFormat sdf = new SimpleDateFormat(format)
            return sdf.format(date)
        } catch (Exception e) {
            log.warn("Erro ao formatar data: ${e.message}")
            return date.toString()
        }
    }

    /**
     * Formata uma data para o formato ISO (yyyy-MM-dd)
     */
    String formatarISO(Date date) {
        return formatar(date, "yyyy-MM-dd")
    }

    /**
     * Formata data e hora (dd/MM/yyyy HH:mm)
     */
    String formatarDataHora(Date date) {
        return formatar(date, "dd/MM/yyyy HH:mm")
    }

    /**
     * Remove horas/minutos/segundos de uma data (zera para meia-noite)
     */
    Date inicioDoDia(Date date) {
        if (!date) return null
        Calendar cal = Calendar.getInstance()
        cal.setTime(date)
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.getTime()
    }

    /**
     * Define uma data para o final do dia (23:59:59.999)
     */
    Date fimDoDia(Date date) {
        if (!date) return null
        Calendar cal = Calendar.getInstance()
        cal.setTime(date)
        cal.set(Calendar.HOUR_OF_DAY, 23)
        cal.set(Calendar.MINUTE, 59)
        cal.set(Calendar.SECOND, 59)
        cal.set(Calendar.MILLISECOND, 999)
        return cal.getTime()
    }

    /**
     * Ajusta dataFim para incluir o dia inteiro (+1 dia)
     */
    Date fimDoPeriodo(Date dataFim) {
        if (!dataFim) return null
        Calendar cal = Calendar.getInstance()
        cal.setTime(dataFim)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        return cal.getTime()
    }

    /**
     * Verifica se uma data é futura
     */
    boolean isDataFutura(Date date) {
        if (!date) return false
        return inicioDoDia(date).after(inicioDoDia(new Date()))
    }

    /**
     * Retorna hoje com hora zerada
     */
    Date hoje() {
        return inicioDoDia(new Date())
    }
}