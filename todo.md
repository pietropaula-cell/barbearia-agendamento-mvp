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
- [x] Total: 16 testes passando


## Link Público de Agendamento
- [x] Rota pública: /agendar/:slug para cada barbearia
- [x] Botão de cópia do link no painel do Admin (copia para clipboard)
- [x] Botão de cópia do link no painel do Dono (copia para clipboard)
- [x] Botão de visualização do link público (abre em nova aba)
- [x] Fluxo de agendamento pré-carregado com a barbearia do slug
- [x] Isolamento de dados: cliente vê apenas barbeiros, serviços e horários da barbearia específica


## Personalização da Barbearia (Nova)
- [x] Schema: adicionar campos logoUrl e accentColor na tabela barbershops
- [x] Upload de logotipo: integrar com S3 via storagePut
- [x] Color picker: permitir seleção de cor de destaque no painel do dono
- [x] Página pública: exibir logotipo e usar cor de destaque personalizada
- [x] Booking.tsx: aplicar tema dinâmico baseado na cor da barbearia
- [x] StepIndicator: aplicar cor de destaque nos passos do agendamento
- [x] Botões principais: aplicar cor de destaque em todos os botões Continuar

## Gestão de Usuários (Nova)
- [x] Botão "Novo Usuário" no painel admin
- [x] Modal/form para criar novo usuário (nome, email, role, barbearia)
- [x] Navegação por clique nas abas laterais (além dos links)
- [x] Sidebar clicável para mudar de aba sem recarregar página

## Seed Data (Nova)
- [x] Procedure seed.createTestData para criar dados de teste
- [x] Corrigir TypeScript errors no seed procedure
- [x] Seed cria: barbearia, owner, 3 barbeiros, 4 serviços
- [x] Todos os 16 testes passando

## Autenticação Local (Nova)
- [x] Sistema de login/senha local (sem Manus OAuth)
- [x] Hash de senha com PBKDF2
- [x] Página de login local
- [x] Admin automático criado com senha gerada
- [x] Sessão segura com cookies
- [x] Corrigir configuração de cookie para desenvolvimento (sameSite: lax)
- [ ] Corrigir deploy no Vercel para rodar servidor Express
- [ ] Testar autenticação no Vercel

## Painel Admin (Nova)
- [ ] Interface para admin gerenciar usuários (criar, editar, deletar)
- [ ] Formulário de criação de usuário com validação
- [ ] Listar usuários com filtros (role, barbearia)
- [ ] Editar role e barbearia de usuário
- [ ] Deletar usuário com confirmação

## Gerenciamento de Barbeiros (Nova)
- [ ] Interface para dono gerenciar barbeiros (criar, editar, deletar)
- [ ] Formulário de criação de barbeiro com validação
- [ ] Listar barbeiros da barbearia
- [ ] Editar dados do barbeiro
- [ ] Deletar barbeiro com confirmação

## Painel Admin Completo (Nova)
- [ ] Dashboard admin com estatísticas
- [ ] Gerenciar barbearias (criar, editar, deletar)
- [ ] Gerenciar usuários (criar, editar, deletar)
- [ ] Visualizar logs de atividades
- [ ] Configurações do sistema

## Testes de Fluxo Completo (Nova)
- [ ] Testar login local
- [ ] Testar criação de usuário pelo admin
- [ ] Testar criação de barbeiro pelo dono
- [ ] Testar fluxo completo de agendamento
- [ ] Testar confirmação de agendamento
- [ ] Testar cancelamento de agendamento
