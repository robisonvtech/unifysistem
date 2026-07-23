# Onda 1 — Núcleo operacional da assistência

Como você respondeu "faça isso" sem escolher, vou pelo caminho que destrava todo o resto: **núcleo operacional** (Clientes + Aparelhos + Ordens de Serviço) com **dashboard enxuto**. Financeiro, Estoque, Portal do Cliente e WhatsApp vêm nas ondas seguintes — cada um depende deste núcleo.

## O que entra nesta onda

**Clientes**
- Cadastro: nome, telefone, e-mail, CPF/CNPJ, endereço, foto, notas
- Busca rápida por nome/telefone
- Detecção de duplicidade por telefone
- Histórico do cliente (todas as OS + aparelhos)

**Aparelhos** (vinculados ao cliente)
- Marca, modelo, IMEI/serial, cor, senha (criptografada), acessórios, condição, % bateria, fotos, observações

**Ordens de Serviço (OS)**
- Número automático sequencial + QR code
- Status: Aguardando diagnóstico → Aguardando aprovação → Aguardando peça → Em reparo → Pronto → Entregue → Garantia
- Checklist de entrada e de entrega (smartphone padrão; customizável depois)
- Timeline de eventos (auto)
- Defeito relatado, diagnóstico, serviços executados, peças
- Valor, prazo estimado, garantia (dias)
- Notas internas (só técnico) vs. notas do cliente
- Técnico responsável (por enquanto = usuário logado)
- **Link público de acompanhamento** (`/track/<token>`) — cliente vê status, timeline e fotos sem login
- Geração de PDF da OS (imprimível)

**Dashboard enxuto** (8 cards)
- OS abertas · Em andamento · Aguardando peça · Aguardando aprovação · Prontas para retirada · Entregues no mês · Receita do mês · Tempo médio de reparo
- Lista das 5 OS mais recentes com status colorido

**Navegação**
- Bottom nav ganha: Dashboard · OS · Clientes · Chat IA · Perfil
- Cursos e Base de conhecimento continuam acessíveis mas fora da nav principal

## Segurança

- RLS: só o dono (admin/técnico) vê suas OS/clientes; link público valida por token opaco
- Senhas de aparelho armazenadas cifradas (pgcrypto)
- Validação Zod em toda entrada de servidor
- Admin (você) enxerga tudo

## Fora do escopo desta onda (ondas futuras)

- Financeiro completo, contas a pagar/receber, PIX/cartão
- Estoque, fornecedores, código de barras
- WhatsApp API, notificações automáticas
- IA que lê conversa e sugere diagnóstico/peça/preço
- Busca automática de imagens contextuais
- Múltiplos técnicos + gestão de produtividade
- Portal do cliente autenticado (por ora só link público read-only)

## Detalhes técnicos

Migrações:
- `customers` (user_id owner, nome, telefone, email, doc, endereço, foto_url, notas)
- `devices` (customer_id, brand, model, imei, serial, color, password_enc, accessories jsonb, condition, battery_pct, photos jsonb, notes)
- `service_orders` (number serial, device_id, customer_id, owner_id, status enum, reported_issue, diagnosis, services jsonb, parts jsonb, price_cents, warranty_days, estimated_delivery, public_token, intake_checklist jsonb, delivery_checklist jsonb)
- `service_order_events` (order_id, type, payload jsonb, created_at) — timeline
- RLS por `owner_id = auth.uid()` + admin bypass via `has_role`
- Rota pública `/track/$token` (top-level, sem auth) lê via server fn publishable com policy `TO anon` filtrando por token

UI:
- shadcn: Table, Dialog, Sheet, Tabs, Command (busca), Badge
- Rotas: `/_authenticated/dashboard`, `/orders`, `/orders/$id`, `/orders/new`, `/customers`, `/customers/$id`, `/track/$token` (público)
- PDF via `@react-pdf/renderer` ou HTML print
- QR via `qrcode` (bun add)

Estimativa: ~15 arquivos novos, 1 migração grande, 1 onda de trabalho.

## Próximos passos após aprovação

1. Aprovo a migração das 4 tabelas + policies
2. Você aceita a migração
3. Construo as rotas e componentes
4. Testo criação de OS → mudança de status → link público → PDF
5. Você valida e escolhemos a Onda 2 (Financeiro ou WhatsApp)
