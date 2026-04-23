// src/utils/constants.js

export const TIPO_CALCULO = {
  PERCENTUAL: 'PERCENTUAL',
  VALOR_FIXO: 'VALOR_FIXO',
  FAIXA_PERCENTUAL: 'FAIXA_PERCENTUAL'
};

export const TIPO_CALCULO_LABELS = {
  [TIPO_CALCULO.PERCENTUAL]: 'Percentual (%)',
  [TIPO_CALCULO.VALOR_FIXO]: 'Valor Fixo (MT)',
  [TIPO_CALCULO.FAIXA_PERCENTUAL]: 'Faixa Percentual'
};

export const TIPO_CALCULO_OPTIONS = [
  { value: TIPO_CALCULO.PERCENTUAL, label: 'Percentual (%)' },
  { value: TIPO_CALCULO.VALOR_FIXO, label: 'Valor Fixo (MT)' },
  { value: TIPO_CALCULO.FAIXA_PERCENTUAL, label: 'Faixa Percentual' }
];
// src/utils/constants.js - Adicione estas constantes

export const TIPO_ABRANGENCIA = {
  NACIONAL: 'NACIONAL',
  PROVINCIAL: 'PROVINCIAL',
  MUNICIPAL: 'MUNICIPAL'
};

export const TIPO_ABRANGENCIA_LABELS = {
  [TIPO_ABRANGENCIA.NACIONAL]: 'Nacional',
  [TIPO_ABRANGENCIA.PROVINCIAL]: 'Provincial',
  [TIPO_ABRANGENCIA.MUNICIPAL]: 'Municipal'
};

export const TIPO_ABRANGENCIA_OPTIONS = [
  { value: TIPO_ABRANGENCIA.NACIONAL, label: '🇲🇿 Nacional' },
  { value: TIPO_ABRANGENCIA.PROVINCIAL, label: '🏛️ Provincial' },
  { value: TIPO_ABRANGENCIA.MUNICIPAL, label: '🏘️ Municipal' }
];

export const TIPO_FERIADO = {
  FIXO: 'FIXO',
  MOVEL: 'MOVEL',
  PONTE: 'PONTE',
  EXCEPCIONAL: 'EXCEPCIONAL'
};

export const TIPO_FERIADO_LABELS = {
  [TIPO_FERIADO.FIXO]: 'Fixo - Mesma data todos os anos',
  [TIPO_FERIADO.MOVEL]: 'Móvel - Data varia anualmente',
  [TIPO_FERIADO.PONTE]: 'Ponte - Entre feriado e fim de semana',
  [TIPO_FERIADO.EXCEPCIONAL]: 'Excepcional - Apenas em ano específico'
};

export const TIPO_FERIADO_OPTIONS = [
  { value: TIPO_FERIADO.FIXO, label: '📅 Fixo (anual)' },
  { value: TIPO_FERIADO.MOVEL, label: '🔄 Móvel' },
  { value: TIPO_FERIADO.PONTE, label: '🌉 Ponte' },
  { value: TIPO_FERIADO.EXCEPCIONAL, label: '⭐ Excepcional' }
];

// Províncias de Moçambique
export const PROVINCIAS = [
  'Maputo', 'Maputo Cidade', 'Gaza', 'Inhambane', 'Sofala',
  'Manica', 'Tete', 'Zambézia', 'Nampula', 'Cabo Delgado', 'Niassa'
];
// src/utils/constants.js - Adicione estas constantes

// Periodicidade de Prestações
export const PERIODICIDADE = {
  DIARIO: 'DIARIO',
  SEMANAL: 'SEMANAL',
  QUINZENAL: 'QUINZENAL',
  MENSAL: 'MENSAL'
};

export const PERIODICIDADE_OPTIONS = [
  { value: PERIODICIDADE.DIARIO, label: '📆 Diário' },
  { value: PERIODICIDADE.SEMANAL, label: '📅 Semanal' },
  { value: PERIODICIDADE.QUINZENAL, label: '📊 Quinzenal' },
  { value: PERIODICIDADE.MENSAL, label: '📈 Mensal' }
];

// Forma de Cálculo
export const FORMA_CALCULO = {
  TAXA_FIXA: 'TAXA_FIXA',
  PMT: 'PMT',
  SAC: 'SAC',
  JUROS_SIMPLES: 'JUROS_SIMPLES',
  JUROS_COMPOSTOS: 'JUROS_COMPOSTOS'
};

export const FORMA_CALCULO_OPTIONS = [
  { value: FORMA_CALCULO.TAXA_FIXA, label: '💰 Taxa Fixa' },
  { value: FORMA_CALCULO.PMT, label: '📊 PMT - Prestações Fixas' },
  { value: FORMA_CALCULO.SAC, label: '📉 SAC - Amortização Constante' },
  { value: FORMA_CALCULO.JUROS_SIMPLES, label: '📈 Juros Simples' },
  { value: FORMA_CALCULO.JUROS_COMPOSTOS, label: '📊 Juros Compostos' }
];

// Periodicidade de Mora
export const PERIODICIDADE_MORA = {
  DIARIO: 'DIARIO',
  SEMANAL: 'SEMANAL',
  QUINZENAL: 'QUINZENAL',
  MENSAL: 'MENSAL'
};

export const PERIODICIDADE_MORA_OPTIONS = [
  { value: '', label: 'Não cobrar mora' },
  { value: PERIODICIDADE_MORA.DIARIO, label: '📆 Diário' },
  { value: PERIODICIDADE_MORA.SEMANAL, label: '📅 Semanal' },
  { value: PERIODICIDADE_MORA.QUINZENAL, label: '📊 Quinzenal' },
  { value: PERIODICIDADE_MORA.MENSAL, label: '📈 Mensal' }
];
