# Entidades (referência do Django legado)

Documento de referência para migração. **Não reutilizar arquitetura MongoDB.**

## Domínio principal

| Entidade | Descrição |
|----------|-----------|
| Profissional | Barbeiros/admin, comissão, cargo, vínculo usuário |
| Servico | Serviços da barbearia (preço, duração, ativo) |
| Agendamento | Reservas com cliente, profissional, serviço, status |
| HorarioDisponivel | Slots de agenda por profissional |
| ClienteMongo | Clientes (dados, histórico, fidelidade) |
| ConfiguracaoBarbearia | Settings globais da unidade |

## Financeiro e vendas

| Entidade | Descrição |
|----------|-----------|
| FormaPagamento | Métodos de pagamento |
| FinanceiroRegistro | Lançamentos financeiros |
| SaldoProfissional / Retirada | Comissões e saques |
| DespesaOperacional | Despesas |
| VendaRoupa / ProdutoRoupa / CategoriaRoupa | Módulo vestuário |

## Fidelidade

| Entidade | Descrição |
|----------|-----------|
| PacoteServico | Pacotes pré-pagos |
| CreditoCliente | Créditos do cliente |
| RegraFidelidade / ProgressoFidelidade | Programa de fidelidade |

## Etapas futuras

1. ETAPA 2: models PostgreSQL + auth JWT
2. ETAPA 3: dashboard Next.js
3. ETAPA 4: migrar módulos na ordem do prompt
4. ETAPA 5: LangGraph + WhatsApp
