// src/main/groovy/app/timali/util/DateConverter.groovy
package app.timali

import java.text.SimpleDateFormat

class DateConverter {

    static final String DATE_FORMAT = "yyyy-MM-dd"
    static final String DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss"

    static Date parse(String dateStr, String format = DATE_FORMAT) {
        if (!dateStr) return null
        try {
            return new SimpleDateFormat(format).parse(dateStr)
        } catch (Exception e) {
            return null
        }
    }

    static String format(Date date, String format = DATE_FORMAT) {
        if (!date) return null
        return new SimpleDateFormat(format).format(date)
    }

    static Date safeParse(Object value, String format = DATE_FORMAT) {
        if (value instanceof Date) return value
        if (value instanceof String) return parse(value, format)
        return null
    }
}