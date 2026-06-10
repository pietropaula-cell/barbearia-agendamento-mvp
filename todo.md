# Sistema de Agendamento para Barbearias — TODO

## Backend / Banco de Dados
- [x] Schema: tabelas barbershops, barbers, barber_schedules, services, customers, appointments
- [x] Estender tabela users com campo role (admin/owner/barber) e barbershop_id
- [x] Rodar pnpm db:push para criar tabelas no banco
- [x] db.ts: helpers para barbershops (CRUD)
- [x] db.ts: helpers para barbers (CRUD)
- [x] db.ts: helpers para barber_schedules (CRUD)
- [x] db.ts: helpers para services (CRUD)
- [x] db.ts: helpers para customers (upsert por telefone)
- [x] db.ts: helpers para appointments (CRUD + disponibilidade)
- [x] Routers: barbershops (admin CRUD + owner read)
- [x] Routers: barbers (owner CRUD)
- [x] Routers: barber_schedules (owner CRUD)
- [x] Routers: services (owner CRUD)
- [x] Routers: appointments (listar, criar, confirmar, cancelar, bloquear)
- [x] Routers: public booking (buscar barbearia por slug, barbeiros, serviços, slots disponíveis)
- [x] Routers: admin users (listar, editar role/barbershop)
- [x] Lógica de disponibilidade: calcular slots livres por barbeiro/data/serviço

## Frontend — Design e Tema
- [x] Configurar tema dark (Craft Modernism) no index.css
- [x] Adicionar fontes Playfair Display + DM Sans no index.html
- [x] Configurar cores: fundo escuro, ouro como accent, texto creme

## Frontend — Estrutura e Rotas
- [x] App.tsx: configurar todas as rotas (público + painel)
- [x] Layout do painel (sidebar dark customizado para cada perfil)

## Frontend — Páginas Públicas
- [x] Home: landing page com lista de barbearias e CTA de agendamento
- [x] Agendamento (/agendar/:slug): fluxo de 6 passos
  - [x] Passo 1: Selecionar barbeiro
  - [x] Passo 2: Selecionar serviço (nome, duração, valor)
  - [x] Passo 3: Selecionar data (apenas disponíveis)
  - [x] Passo 4: Selecionar horário (apenas livres)
  - [x] Passo 5: Informar nome e telefone
  - [x] Passo 6: Confirmar e resumo do agendamento

## Frontend — Painel Admin
- [x] Dashboard admin: visão geral
- [x] Gerenciar barbearias: listar, criar, editar, excluir
- [x] Gerenciar usuários: listar, editar role e barbearia

## Frontend — Painel Dono da Barbearia
- [x] Dashboard owner: visão geral da barbearia
- [x] Gerenciar barbeiros: listar, criar, editar, excluir
- [x] Gerenciar serviços: listar, criar, editar, excluir
- [x] Definir horários de trabalho dos barbeiros
- [x] Visualizar agenda completa da barbearia (confirmar/cancelar)

## Frontend — Painel Barbeiro
- [x] Visualizar meus agendamentos
- [x] Confirmar atendimento
- [x] Cancelar atendimento
- [x] Bloquear horário da agenda

## Testes
- [x] Testes de routers: auth (logout, me)
- [x] Testes de routers: barbershops (RBAC)
- [x] Testes de routers: appointments (disponibilidade, RBAC)
- [x] Testes de routers: public booking (getBarbershop, getAvailableSlots, getAvailableDates)
- [x] Total: 13 testes passando


## Link Público de Agendamento
- [x] Rota pública: /agendar/:slug para cada barbearia
- [x] Botão de cópia do link no painel do Admin (copia para clipboard)
- [x] Botão de cópia do link no painel do Dono (copia para clipboard)
- [x] Botão de visualização do link público (abre em nova aba)
- [x] Fluxo de agendamento pré-carregado com a barbearia do slug
- [x] Isolamento de dados: cliente vê apenas barbeiros, serviços e horários da barbearia específica
