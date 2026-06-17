# Guia de Deploy - BarberBook

Este documento descreve como fazer deploy da aplicação BarberBook no Railway.

## Opção 1: Deploy Automático via Script (Recomendado)

### Pré-requisitos

- Railway CLI instalado (`npm install -g @railway/cli`)
- Acesso ao projeto no Railway
- Git configurado com credenciais do GitHub

### Executar Deploy

```bash
# Deploy com mensagem padrão
./deploy.sh

# Deploy com mensagem customizada
./deploy.sh "Implementar nova funcionalidade X"
```

### O que o script faz

1. ✅ Verifica status do git
2. ✅ Commita mudanças não commitadas
3. ✅ Faz push para repositório Manus (S3)
4. ✅ Faz push para GitHub (backup)
5. ✅ Instala Railway CLI (se necessário)
6. ✅ Faz deploy no Railway
7. ✅ Configura job de scheduled para lembretes de WhatsApp

### Exemplo de Saída

```
[21:45:30] Iniciando deploy para Railway...
[21:45:30] Projeto: barbearia-agendamento-mvp
[21:45:30] Branch: main
[21:45:31] Verificando status do git...
✓ Sem mudanças não commitadas
[21:45:32] Fazendo push para repositório Manus...
✓ Push para origin concluído
[21:45:35] Fazendo push para GitHub...
✓ Push para GitHub concluído
[21:45:40] Verificando Railway CLI...
✓ Railway CLI encontrado
[21:45:41] Iniciando deploy no Railway...
✓ Deploy no Railway concluído com sucesso!
[21:45:50] Configurando lembretes automáticos de WhatsApp...
✓ Job de WhatsApp criado com sucesso!
✓ Deploy concluído com sucesso!
```

## Opção 2: Deploy Manual via Management UI

1. Abra a Management UI (painel no lado direito)
2. Clique no botão **"Publish"** (canto superior direito)
3. Aguarde o deploy ser concluído

## Opção 3: Deploy Manual via Railway CLI

```bash
# Fazer login no Railway
railway login

# Fazer deploy
railway up

# Verificar status
railway status
```

## Opção 4: Deploy Manual via GitHub

Se o Railway estiver configurado com GitHub:

1. Faça push para GitHub:
   ```bash
   git push github main
   ```

2. O Railway detectará automaticamente a mudança e iniciará o deploy

## Configurar Lembretes de WhatsApp Automáticos

Após deploy bem-sucedido, execute:

```bash
manus-heartbeat create \
  --name whatsapp-reminder \
  --cron "0 */1 * * * *" \
  --path /api/scheduled/whatsapp-reminder
```

Isso criará um job que:
- ✅ Executa a cada 1 hora
- ✅ Busca agendamentos na próxima hora
- ✅ Envia lembretes via WhatsApp

### Verificar Jobs Criados

```bash
manus-heartbeat list
```

### Deletar Job (se necessário)

```bash
manus-heartbeat delete --name whatsapp-reminder
```

## Troubleshooting

### Erro: "Railway CLI não encontrado"

```bash
npm install -g @railway/cli
railway login
```

### Erro: "Falha ao fazer push para GitHub"

Verifique:
- Credenciais do GitHub estão corretas
- Token de acesso tem permissão de push
- Remote GitHub está configurado:
  ```bash
  git remote -v
  ```

### Erro: "Falha ao fazer deploy no Railway"

1. Verifique se está logado no Railway:
   ```bash
   railway whoami
   ```

2. Verifique se o projeto está selecionado:
   ```bash
   railway status
   ```

3. Veja os logs de deploy:
   ```bash
   railway logs
   ```

### Erro: "Não foi possível criar job de WhatsApp"

Verifique:
- `manus-heartbeat` está instalado
- Você tem permissão para criar scheduled jobs
- O endpoint `/api/scheduled/whatsapp-reminder` está acessível

## Variáveis de Ambiente Necessárias

Certifique-se de que as seguintes variáveis estão configuradas no Railway:

```
DATABASE_URL=mysql://...
JWT_SECRET=seu-secret-aqui
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://...
VITE_OAUTH_PORTAL_URL=https://...
OWNER_OPEN_ID=seu-owner-id
OWNER_NAME=Seu Nome
BUILT_IN_FORGE_API_URL=https://...
BUILT_IN_FORGE_API_KEY=sua-chave-aqui
VITE_FRONTEND_FORGE_API_KEY=sua-chave-frontend
VITE_FRONTEND_FORGE_API_URL=https://...
```

## Monitoramento Pós-Deploy

Após deploy bem-sucedido:

1. Acesse a aplicação: `https://seu-dominio.railway.app`
2. Verifique os logs: `railway logs`
3. Teste funcionalidades principais:
   - ✅ Página inicial carrega
   - ✅ Listagem de barbearias funciona
   - ✅ Agendamento funciona
   - ✅ Busca de agendamento por telefone funciona
   - ✅ Lembretes de WhatsApp são enviados

## Rollback (Reverter Deploy)

Se algo der errado:

```bash
# Ver histórico de deployments
railway deployments

# Fazer rollback para versão anterior
railway rollback <deployment-id>
```

## Suporte

Para mais informações:
- [Railway Docs](https://docs.railway.app)
- [Manus Docs](https://docs.manus.im)
- [GitHub Repository](https://github.com/pietropaula-cell/barbearia-agendamento-mvp)
