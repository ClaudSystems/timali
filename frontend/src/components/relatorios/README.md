# 📊 Módulo de Relatórios - Timali

## Visão Geral

Módulo completo de relatórios analíticos para o sistema Timali, com dashboard em tempo real e 10 tipos de relatórios diferentes.

---

## 🚀 Funcionalidades Implementadas

### 1. **Dashboard Analítico** (`DashboardAnalitico.jsx`)
- **Visão geral da empresa em tempo real**
- Atualização automática a cada 30 segundos
- Cards com métricas principais:
  - Créditos ativos, em mora, quitados
  - Total concedido, recebido, saldo devedor
  - Performance do mês atual
  - Lucro/Prejuízo com cores dinâmicas
- Indicadores de saúde financeira:
  - Taxa de inadimplência (gráfico circular)
  - Taxa de recuperação (gráfico circular)
- Alertas automáticos:
  - Créditos em mora
  - Inadimplência alta (>20%)
  - Lucro negativo

### 2. **Relatório de Créditos Emitidos** (`RelatorioCreditosEmitidos.jsx`)
- Filtro por período (data início/fim)
- Lista completa de créditos concedidos
- Exportação PDF e Excel
- Resumo com totais

### 3. **Relatório de Créditos por Gestor** (`RelatorioCreditosPorGestor.jsx`)
- Agrupamento por gestor/concessionário
- Filtro opcional por gestor específico
- Visualização em collapse (accordion)
- Detalhamento por gestor

### 4. **Relatório de Prestações por Vencimento** (`RelatorioPrestacoes.jsx`)
- Prestações agrupadas por intervalo de vencimento
- Status: Pago, Pendente, Em Mora
- Dias de atraso
- Filtro por período de vencimento

### 5. **Relatório de Pagamentos Recebidos** (`RelatorioPagamentos.jsx`)
- Todos os pagamentos em um período
- Forma de pagamento
- Valor médio por pagamento
- Agrupamento por forma de pagamento

### 6. **Relatório de Saídas/Gastos** (`RelatorioSaidas.jsx`)
- Gastos e saídas do caixa
- Categorização de gastos
- Totais por categoria
- Filtro por período

### 7. **Relatório de Diários** (`RelatorioDiarios.jsx`)
- Movimentação diária do caixa
- Saldo inicial/entradas/saídas/saldo final
- Status de fechamento
- Responsável pelo diário

### 8. **Relatório de Créditos em Mora** (`RelatorioCreditosEmMora.jsx`)
- **Todos os créditos com pagamentos em atraso**
- Valor total em mora
- Parcelas em atraso
- Maior atraso (dias)
- Telefone do cliente para contato
- Exportação PDF/Excel

### 9. **Relatório de Clientes com Atrasos** (`RelatorioClientesAtrasados.jsx`)
- Clientes ordenados por valor em mora
- Número de créditos em atraso
- Maior atraso por cliente
- Detalhes dos créditos em mora
- Código de cores por gravidade

### 10. **Relatório de Usuários** (`RelatorioUsuarios.jsx`)
- Todos os usuários do sistema
- Status ativo/inativo
- Número de créditos ativos por usuário
- Data de criação

---

## 🏗️ Arquitetura

### Backend (Grails/Groovy)

#### Service: `RelatorioService.groovy`
Localização: `app-timali/grails-app/services/app/timali/RelatorioService.groovy`

Métodos disponíveis:
```groovy
- creditosEmitidosPorPeriodo(Date dataInicio, Date dataFim)
- creditosPorGestor(Date dataInicio, Date dataFim, String gestor)
- prestacoesPorVencimento(Date dataInicio, Date dataFim)
- pagamentosRecebidos(Date dataInicio, Date dataFim)
- saidasPorPeriodo(Date dataInicio, Date dataFim)
- diariosPorPeriodo(Date dataInicio, Date dataFim)
- creditosEmMora()
- todosUsuarios()
- usuariosComCreditosAtivos()
- clientesComAtrasos()
- avaliarPontualidadeCliente(Long clienteId)
- dashboardAnalitico()
```

#### Controller: `RelatorioController.groovy`
Localização: `app-timali/grails-app/controllers/app/timali/RelatorioController.groovy`

Endpoints REST:
```
GET /api/relatorios/dashboardAnalitico
GET /api/relatorios/creditosEmitidos?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD
GET /api/relatorios/creditosPorGestor?dataInicio=...&dataFim=...&gestor=xxx
GET /api/relatorios/prestacoesPorVencimento?dataInicio=...&dataFim=...
GET /api/relatorios/pagamentosRecebidos?dataInicio=...&dataFim=...
GET /api/relatorios/saidas?dataInicio=...&dataFim=...
GET /api/relatorios/diarios?dataInicio=...&dataFim=...
GET /api/relatorios/creditosEmMora
GET /api/relatorios/usuarios
GET /api/relatorios/usuariosComCreditos
GET /api/relatorios/clientesComAtrasos
GET /api/relatorios/avaliarCliente/{clienteId}
```

### Frontend (React/Ant Design)

#### Service: `relatorioService.js`
Localização: `frontend/src/services/relatorioService.js`

Wrapper para todas as chamadas API.

#### Página Principal: `RelatoriosPage.jsx`
Localização: `frontend/src/pages/RelatoriosPage.jsx`

Menu lateral com navegação entre relatórios.

#### Componentes de Relatório
Localização: `frontend/src/components/relatorios/`

Cada relatório é um componente React independente.

---

## 🎨 Como Usar

### Acessando o Módulo

1. No menu principal, clique em **"Relatórios"**
2. Selecione o relatório desejado no menu lateral
3. Configure os filtros (período, gestor, etc.)
4. Clique em **"Gerar"** ou **"Atualizar"**
5. Exporte para PDF ou Excel se necessário

### Dashboard Analítico

O dashboard é atualizado automaticamente a cada 30 segundos. Mostra:
- Estado geral dos créditos
- Performance financeira do mês
- Indicadores de saúde (inadimplência, recuperação)
- Alertas em tempo real

### Exportação de Dados

Todos os relatórios suportam:
- **PDF**: Documento formatado pronto para impressão
- **Excel**: Planilha editável para análise

---

## 🔧 Personalização

### Adicionar Novo Relatório

1. **Backend**: Criar método em `RelatorioService.groovy`
2. **Controller**: Adicionar endpoint em `RelatorioController.groovy`
3. **UrlMappings**: Mapear rota em `UrlMappings.groovy`
4. **Frontend Service**: Adicionar função em `relatorioService.js`
5. **Componente**: Criar arquivo em `components/relatorios/`
6. **Página**: Adicionar item no menu em `RelatoriosPage.jsx`

### Exemplo de Estrutura de Relatório

```javascript
const RelatorioExemplo = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState(null);

    const handleGerar = async (values) => {
        setLoading(true);
        const resultado = await relatorioService.exemplo(
            values.periodo[0].format('YYYY-MM-DD'),
            values.periodo[1].format('YYYY-MM-DD')
        );
        setDados(resultado);
        setLoading(false);
    };

    return (
        <div>
            <Title level={3}>Título do Relatório</Title>
            <Card size="small">
                <Form form={form} layout="inline" onFinish={handleGerar}>
                    {/* Filtros */}
                </Form>
            </Card>
            {dados && (
                <>
                    {/* Resumo */}
                    <Table columns={columns} dataSource={dados.dados} />
                </>
            )}
        </div>
    );
};
```

---

## 📈 Avaliação de Pontualidade de Clientes

O sistema inclui um serviço automático de avaliação que classifica clientes conforme sua pontualidade nos pagamentos:

### Classificações:
- **EXCELENTE** (≥95% no prazo) - Verde (#52c41a)
- **BOM** (≥80% no prazo) - Azul (#1890ff)
- **REGULAR** (≥60% no prazo) - Amarelo (#faad14)
- **RUIM** (≥40% no prazo) - Laranja (#fa8c16)
- **PÉSSIMO** (<40% no prazo) - Vermelho (#ff4d4f)

### Métricas Calculadas:
- Percentual de pagamentos no prazo
- Média de dias de atraso
- Total de parcelas pagas/atrasadas/pendentes

### Uso:
```javascript
// Avaliar cliente específico
const avaliacao = await relatorioService.avaliarCliente(clienteId);

// Resultado:
{
    classificacao: "EXCELENTE",
    percentualNoPrazo: 95.5,
    mediaDiasAtraso: 2.3,
    // ... mais dados
}
```

---

## 🎯 Cores e Significados

### Dashboard e Relatórios:
- **Verde (#52c41a)**: Valores positivos, recebimentos, situação boa
- **Azul (#1890ff)**: Informações neutras, valores concedidos
- **Vermelho (#ff4d4f)**: Débitos, mora, prejuízo, alertas críticos
- **Amarelo/Laranja (#faad14/#fa8c16)**: Atenção, pendências, situação regular/ruim
- **Roxo (#722ed1)**: Saldos, totais gerais

---

## ⚙️ Configurações Técnicas

### Dependências Necessárias

Backend (já instaladas):
- Grails 5.x
- GORM para Hibernate

Frontend (já instaladas):
- antd ^5.x
- moment
- jspdf
- jspdf-autotable
- xlsx

### Rota no App.js

```javascript
<Route
    path="/relatorios"
    element={
        <PrivateRoute>
            <MainLayout>
                <RelatoriosPage />
            </MainLayout>
        </PrivateRoute>
    }
/>
```

---

## 📝 Notas Importantes

1. **Dashboard em Tempo Real**: Atualiza automaticamente a cada 30 segundos
2. **Datas**: Sempre usar formato `YYYY-MM-DD` nas chamadas API
3. **Exportação**: PDF usa jsPDF + autoTable, Excel usa biblioteca xlsx
4. **Performance**: Relatórios grandes podem demorar - use paginação
5. **Segurança**: Todas as rotas são protegidas (PrivateRoute)

---

## 🐛 Troubleshooting

### Relatório não carrega:
- Verificar se backend está rodando
- Checar console do navegador para erros
- Confirmar que UrlMappings está correto

### Exportação PDF falha:
- Verificar se `jspdf` e `jspdf-autotable` estão instalados
- Checar tamanho dos dados (muito grande pode travar)

### Dashboard não atualiza:
- Verificar conexão com backend
- Checar se endpoint `/api/relatorios/dashboardAnalitico` responde

---

## 🚀 Próximos Passos (Melhorias Futuras)

1. Adicionar gráficos (Chart.js ou Recharts)
2. Filtros avançados (múltiplos gestores, categorias)
3. Agendamento de relatórios por email
4. Cache de resultados para performance
5. Relatórios customizáveis pelo usuário
6. Dashboards específicos por perfil (gestor, admin)

---

## 📞 Suporte

Para dúvidas ou problemas, verificar:
1. Logs do backend (console do Grails)
2. Console do navegador (F12)
3. Network tab para verificar chamadas API

---

**Versão**: 1.0.0  
**Data**: Maio 2026  
**Autor**: Equipe Timali
