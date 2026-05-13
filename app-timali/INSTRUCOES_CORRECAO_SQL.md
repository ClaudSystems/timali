# Instruções para Corrigir o Erro de Constraint

## Problema
As colunas calculadas (`total_previsto`, `total_pago`, etc.) ainda existem no banco de dados com constraint NOT NULL, causando erro ao salvar créditos.

## Solução

Execute ONE das opções abaixo no seu banco de dados PostgreSQL:

### Opção 1: Remover constraints NOT NULL (Recomendado - Mais Seguro)

```sql
ALTER TABLE credito ALTER COLUMN total_previsto DROP NOT NULL;
ALTER TABLE credito ALTER COLUMN total_pago DROP NOT NULL;
ALTER TABLE credito ALTER COLUMN total_pago_no_prazo DROP NOT NULL;
ALTER TABLE credito ALTER COLUMN total_em_divida DROP NOT NULL;
ALTER TABLE credito ALTER COLUMN total_juros_pago DROP NOT NULL;
ALTER TABLE credito ALTER COLUMN total_multa_pago DROP NOT NULL;
ALTER TABLE credito ALTER COLUMN total_juros_demora_pago DROP NOT NULL;
```

### Opção 2: Remover colunas completamente (Mais Limpo)

```sql
ALTER TABLE credito DROP COLUMN IF EXISTS total_previsto;
ALTER TABLE credito DROP COLUMN IF EXISTS total_pago;
ALTER TABLE credito DROP COLUMN IF EXISTS total_pago_no_prazo;
ALTER TABLE credito DROP COLUMN IF EXISTS total_em_divida;
ALTER TABLE credito DROP COLUMN IF EXISTS total_juros_pago;
ALTER TABLE credito DROP COLUMN IF EXISTS total_multa_pago;
ALTER TABLE credito DROP COLUMN IF EXISTS total_juros_demora_pago;
```

## Como Executar

### Via pgAdmin:
1. Abra o pgAdmin
2. Conecte-se ao banco `timali`
3. Clique em "Tools" > "Query Tool"
4. Cole o SQL da Opção 1 ou Opção 2
5. Clique em "Execute" (F5)

### Via linha de comando:
```bash
psql -U postgres -d timali -f W:\projects\timali\app-timali\remove_colunas_calculadas.sql
```

Ou diretamente:
```bash
psql -U postgres -d timali
```
E cole os comandos SQL.

## Verificação

Após executar, teste criando um novo crédito. O erro não deve mais aparecer.

## Nota
- As colunas agora são calculadas automaticamente via getters na classe `Credito.groovy`
- Não é necessário persistir esses valores no banco
- Os getters calculam os totais dinamicamente baseado nas parcelas
