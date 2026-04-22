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