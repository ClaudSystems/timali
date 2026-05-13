-- Script para remover colunas calculadas da tabela credito
-- Essas colunas agora são calculadas via getters e não devem ser persistidas

-- Remover constraints NOT NULL das colunas calculadas
ALTER TABLE credito ALTER COLUMN total_previsto DROP NOT NULL;
ALTER TABLE credito ALTER COLUMN total_pago DROP NOT NULL;
ALTER TABLE credito ALTER COLUMN total_pago_no_prazo DROP NOT NULL;
ALTER TABLE credito ALTER COLUMN total_em_divida DROP NOT NULL;
ALTER TABLE credito ALTER COLUMN total_juros_pago DROP NOT NULL;
ALTER TABLE credito ALTER COLUMN total_multa_pago DROP NOT NULL;
ALTER TABLE credito ALTER COLUMN total_juros_demora_pago DROP NOT NULL;

-- Opcional: Remover as colunas completamente (recomendado)
-- ALTER TABLE credito DROP COLUMN IF EXISTS total_previsto;
-- ALTER TABLE credito DROP COLUMN IF EXISTS total_pago;
-- ALTER TABLE credito DROP COLUMN IF EXISTS total_pago_no_prazo;
-- ALTER TABLE credito DROP COLUMN IF EXISTS total_em_divida;
-- ALTER TABLE credito DROP COLUMN IF EXISTS total_juros_pago;
-- ALTER TABLE credito DROP COLUMN IF EXISTS total_multa_pago;
-- ALTER TABLE credito DROP COLUMN IF EXISTS total_juros_demora_pago;
