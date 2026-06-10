# Arquitetura do Sistema de Agendamento para Barbearias

## Modelagem do Banco de Dados

### Tabela: users
| Coluna       | Tipo         | Restrições                              |
|--------------|--------------|-----------------------------------------|
| id           | UUID         | PK, DEFAULT gen_random_uuid()           |
| name         | VARCHAR(100) | NOT NULL                                |
| email        | VARCHAR(150) | NOT NULL, UNIQUE                        |
| password_hash| VARCHAR(255) | NOT NULL                                |
| role         | ENUM         | 'admin' | 'owner' | 'barber'            |
| barbershop_id| UUID         | FK → barbershops(id), NULLABLE          |
| created_at   | TIMESTAMPTZ  | DEFAULT now()                           |
| updated_at   | TIMESTAMPTZ  | DEFAULT now()                           |

### Tabela: barbershops
| Coluna      | Tipo         | Restrições                    |
|-------------|--------------|-------------------------------|
| id          | UUID         | PK, DEFAULT gen_random_uuid() |
| name        | VARCHAR(100) | NOT NULL                      |
| slug        | VARCHAR(100) | NOT NULL, UNIQUE              |
| phone       | VARCHAR(20)  |                               |
| address     | VARCHAR(255) |                               |
| owner_id    | UUID         | FK → users(id)                |
| created_at  | TIMESTAMPTZ  | DEFAULT now()                 |
| updated_at  | TIMESTAMPTZ  | DEFAULT now()                 |

### Tabela: barbers
| Coluna        | Tipo         | Restrições                    |
|---------------|--------------|-------------------------------|
| id            | UUID         | PK, DEFAULT gen_random_uuid() |
| user_id       | UUID         | FK → users(id), NULLABLE      |
| barbershop_id | UUID         | FK → barbershops(id)          |
| name          | VARCHAR(100) | NOT NULL                      |
| bio           | TEXT         |                               |
| avatar_url    | VARCHAR(255) |                               |
| active        | BOOLEAN      | DEFAULT true                  |
| created_at    | TIMESTAMPTZ  | DEFAULT now()                 |
| updated_at    | TIMESTAMPTZ  | DEFAULT now()                 |

### Tabela: barber_schedules
| Coluna        | Tipo         | Restrições                    |
|---------------|--------------|-------------------------------|
| id            | UUID         | PK, DEFAULT gen_random_uuid() |
| barber_id     | UUID         | FK → barbers(id)              |
| day_of_week   | SMALLINT     | 0=Dom … 6=Sáb                 |
| start_time    | TIME         | NOT NULL                      |
| end_time      | TIME         | NOT NULL                      |

### Tabela: services
| Coluna        | Tipo           | Restrições                    |
|---------------|----------------|-------------------------------|
| id            | UUID           | PK, DEFAULT gen_random_uuid() |
| barbershop_id | UUID           | FK → barbershops(id)          |
| name          | VARCHAR(100)   | NOT NULL                      |
| description   | TEXT           |                               |
| duration_min  | SMALLINT       | NOT NULL (minutos)            |
| price         | NUMERIC(10,2)  | NOT NULL                      |
| active        | BOOLEAN        | DEFAULT true                  |
| created_at    | TIMESTAMPTZ    | DEFAULT now()                 |

### Tabela: customers
| Coluna     | Tipo         | Restrições                    |
|------------|--------------|-------------------------------|
| id         | UUID         | PK, DEFAULT gen_random_uuid() |
| name       | VARCHAR(100) | NOT NULL                      |
| phone      | VARCHAR(20)  | NOT NULL                      |
| created_at | TIMESTAMPTZ  | DEFAULT now()                 |

### Tabela: appointments
| Coluna        | Tipo        | Restrições                                                  |
|---------------|-------------|-------------------------------------------------------------|
| id            | UUID        | PK, DEFAULT gen_random_uuid()                               |
| barbershop_id | UUID        | FK → barbershops(id)                                        |
| barber_id     | UUID        | FK → barbers(id)                                            |
| service_id    | UUID        | FK → services(id)                                           |
| customer_id   | UUID        | FK → customers(id)                                          |
| starts_at     | TIMESTAMPTZ | NOT NULL                                                    |
| ends_at       | TIMESTAMPTZ | NOT NULL                                                    |
| status        | ENUM        | 'pending' | 'confirmed' | 'cancelled' | 'blocked'          |
| notes         | TEXT        |                                                             |
| created_at    | TIMESTAMPTZ | DEFAULT now()                                               |
| updated_at    | TIMESTAMPTZ | DEFAULT now()                                               |

---

## Arquitetura do Projeto

### Stack Tecnológica
- **Frontend:** React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Backend:** Node.js + Express (via upgrade web-db-user)
- **Banco:** PostgreSQL
- **Auth:** JWT (access token + refresh token)
- **Roteamento:** Wouter (client-side)

### Estrutura de Rotas Públicas
- `/` — Landing page / home
- `/agendar/:slug` — Fluxo de agendamento do cliente (6 passos)
- `/login` — Login de usuários internos

### Estrutura de Rotas Privadas (painel)
- `/painel` — Dashboard (redireciona por role)
- `/painel/barbearias` — Admin: listar/criar barbearias
- `/painel/usuarios` — Admin: gerenciar usuários
- `/painel/agendamentos` — Admin: todos os agendamentos
- `/painel/barbeiros` — Owner: barbeiros da barbearia
- `/painel/servicos` — Owner: serviços
- `/painel/agenda` — Owner: agenda completa
- `/painel/meus-agendamentos` — Barber: seus agendamentos

### Regras de Negócio Principais
1. Horários disponíveis = horário de trabalho do barbeiro − agendamentos existentes − bloqueios
2. Duração do slot = duration_min do serviço selecionado
3. Conflito verificado por: starts_at < ends_at_existente AND ends_at > starts_at_existente
4. Cancelamento disponível para barbeiro e cliente (via link)
5. Slug da barbearia deve ser único e URL-safe

### Preparação para Futuras Integrações
- Tabela `customers` com campo `phone` pronto para WhatsApp
- Campo `notes` em `appointments` para contexto de chatbot
- Estrutura de eventos no backend preparada para webhooks
