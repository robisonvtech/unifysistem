
## Visão

Adotar as 3 telas de referência que você enviou como sistema visual oficial da Unify RepairAI:

- **START (light minimal)** — cards limpos, muito espaço, foco em ações rápidas.
- **PRO (light premium)** — mascote hero, cards com badges PRO/IA, KPIs com sparkline.
- **ELITE (dark futurista)** — fundo #090909, aura vermelha, ícones neon, dashboard denso.

A paleta primary `#BF0000`, backgrounds `#FAFAFA`/`#090909`, textos `#1A1A1A`/`#FFFFFF` e efeitos (glassmorphism, blur, sombras suaves) viram tokens semânticos em `src/styles.css`. Cada plano recebe seu próprio layout de dashboard e badge, comutáveis pelo campo `subscription_status` (start/pro/elite).

## Entregas por onda

### Onda A — Fundação visual (esta rodada)
- Gerar o mascote fantasminha premium como asset (light + dark + hero) via `imagegen` e servir via Lovable Assets.
- Reescrever `src/styles.css` com os tokens da nova identidade (cores, gradientes vermelhos, sombras `--shadow-elegant`, `--shadow-glow`, glass tokens, tipografia SF-like via Inter).
- Atualizar `UnifyMascot.tsx` para renderizar o asset com estados (idle/pensando/feliz/erro) usando aura CSS + micro-anima.
- Novo `BottomNav` centralizado com botão flutuante do mascote (como nas 3 refs).
- Adicionar `elite` ao enum `subscription_status` e um hook `usePlan()` que devolve `{ plan, theme, dashboard }`.

### Onda B — Redesenho tela a tela
Refazer, uma por uma, mantendo lógica atual:
1. `dashboard.tsx` — 3 variantes (Start / Pro / Elite) selecionadas por plano.
2. `chat.tsx` — layout premium com hero do mascote, streaming, quick actions em pill.
3. `courses.tsx`, `profile.tsx`, `more.tsx`.
4. `orders.tsx`, `orders.$id.tsx`, `orders.new.tsx`, `customers.tsx`, `inventory.tsx`, `finance.tsx`, `history.tsx`, `knowledge.tsx`.
5. `auth.tsx` + `index.tsx` (landing/onboarding).

Cada tela ganha `head()` com metadata própria.

### Onda C — Biometria (WebAuthn/Passkeys)
- Migration: tabela `webauthn_credentials` (owner_id, credential_id, public_key, counter, transports) com RLS estrita.
- Server functions `registerPasskey` / `verifyPasskey` usando `@simplewebauthn/server`.
- UI no `profile.tsx`: "Ativar Face ID / Touch ID" — usa `navigator.credentials.create` no dispositivo do usuário.
- Login em `auth.tsx` com botão "Entrar com biometria" quando `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`.
- Sessão continua Supabase Auth; passkey substitui a senha via magic-link server-signed.

## Detalhes técnicos

- **Mascote**: 3 imagens (`unify-hero-light`, `unify-hero-dark`, `unify-mini`) via `imagegen` premium, PNG transparente. Servidas por `lovable-assets` (não vai pro bundle).
- **Tokens** (extrato de `src/styles.css`):
  ```
  --primary: 0 100% 37.5%;          /* #BF0000 */
  --primary-glow: 0 100% 55%;
  --gradient-primary: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)));
  --shadow-elegant: 0 20px 60px -20px hsl(var(--primary) / 0.25);
  --shadow-glow: 0 0 40px hsl(var(--primary-glow) / 0.35);
  --glass-bg: color-mix(in oklab, white 60%, transparent);
  ```
- **Plano ELITE**: novo tema aplicado via `<html data-plan="elite">` — `@custom-variant elite-plan` no CSS troca fundos e adiciona aura.
- **WebAuthn**: `@simplewebauthn/browser` (client) + `@simplewebauthn/server` (server fn). Challenges gravados em `auth_challenges` com TTL de 5 min.
- **Escopo fora**: cursos/planos dinâmicos, editor admin de layouts, upload de esquemas/BoardViews, IA multimodal áudio/vídeo, notificações push — ficam para as próximas ondas.

## Ordem de execução

Vou executar **Onda A inteira nesta rodada** (fundação + mascote + navegação nova + tokens + suporte a `elite`). Depois volto e você me diz por qual tela da Onda B começo (sugiro dashboard → chat). Onda C (WebAuthn) entra por último para não misturar código sensível de auth com o redesign.

Confirma para eu começar?
