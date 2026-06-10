# Ideias de Design — Sistema de Agendamento para Barbearias

<response>
<idea>
**Design Movement:** Artesanal Moderno (Craft Modernism) — inspirado em barbearias premium e estúdios de design europeus dos anos 2010s.

**Core Principles:**
- Contraste alto entre fundo escuro e tipografia clara, criando atmosfera de sofisticação
- Hierarquia visual construída por peso tipográfico, não por cor
- Espaçamento generoso que transmite confiança e qualidade
- Componentes limpos com bordas sutis e sombras suaves

**Color Philosophy:**
- Fundo: `#0F0F0F` (quase preto, não totalmente para evitar dureza)
- Superfície de card: `#1A1A1A`
- Primário: `#C9A84C` (ouro envelhecido — remete a navalhas e tradição)
- Texto: `#F5F0E8` (creme quente, não branco puro)
- Muted: `#6B6B6B`
- Destrutivo: `#E05252`

**Layout Paradigm:**
- Sidebar fixa à esquerda para o painel administrativo (não top-nav)
- Fluxo de agendamento em cards centralizados com progress bar no topo
- Landing page assimétrica com texto à esquerda e visual à direita

**Signature Elements:**
- Linha dourada fina como separador e acento em títulos
- Ícones de barbearia (tesoura, navalha) como elementos decorativos sutis
- Numeração romana em steps do agendamento (I, II, III…)

**Interaction Philosophy:**
- Hover states com transição de cor suave (200ms)
- Botões com scale(0.97) no active
- Cards selecionados com borda dourada animada

**Animation:**
- Entrada de páginas: fade + slide-up (200ms ease-out)
- Steps do agendamento: slide horizontal entre passos
- Toasts: slide-in da direita

**Typography System:**
- Display: `Playfair Display` (serif, para títulos e nomes)
- Body: `DM Sans` (sans-serif, para textos e labels)
- Mono: `JetBrains Mono` (para horários e valores)
</idea>
<probability>0.08</probability>
</response>

<response>
<idea>
**Design Movement:** Neo-Brutalismo Suave — brutalismo com refinamento, sem agressividade excessiva.

**Core Principles:**
- Bordas visíveis e sombras offset criam profundidade sem gradientes
- Tipografia bold e oversized como elemento visual principal
- Fundo claro com acentos vibrantes e inesperados
- Grid irregular com quebras intencionais de alinhamento

**Color Philosophy:**
- Fundo: `#FAFAF7` (off-white levemente amarelado)
- Primário: `#1A1A2E` (azul-marinho escuro)
- Acento: `#FF6B35` (laranja vibrante para CTAs)
- Bordas: `#1A1A2E` (mesma cor do primário, 1-2px)
- Sombra offset: `4px 4px 0px #1A1A2E`

**Layout Paradigm:**
- Cards com sombra offset em vez de box-shadow suave
- Sidebar com borda direita grossa
- Steps do agendamento em cards empilhados com numeração grande

**Signature Elements:**
- Sombras offset em todos os cards interativos
- Tipografia display em peso 900 para títulos de seção
- Tags de status com bordas sólidas e sem border-radius

**Interaction Philosophy:**
- Hover em cards: sombra offset aumenta (4px → 8px)
- Botões: sombra offset some no click (efeito "pressionar")
- Seleção: borda grossa no item ativo

**Animation:**
- Transições de 150ms linear (brutalismo é direto)
- Sem fade — preferir transform apenas
- Steps: slide direto sem easing suave

**Typography System:**
- Display: `Space Grotesk` (peso 700-900)
- Body: `Space Grotesk` (peso 400-500)
- Mono: `Space Mono` (para horários)
</idea>
<probability>0.07</probability>
</response>

<response>
<idea>
**Design Movement:** Minimalismo Orgânico — inspirado em spas e estúdios de wellness modernos, aplicado ao contexto de barbearia premium.

**Core Principles:**
- Fundo claro com tons quentes de bege/areia criam acolhimento
- Tipografia serifada misturada com sans-serif clean
- Muito espaço em branco como elemento de design intencional
- Componentes com border-radius generoso e sombras muito suaves

**Color Philosophy:**
- Fundo: `#FAF8F5` (areia muito claro)
- Card: `#FFFFFF`
- Primário: `#2D5016` (verde floresta escuro — masculino e orgânico)
- Acento: `#8B6914` (dourado terroso)
- Texto: `#1C1C1C`
- Muted: `#9B9B9B`

**Layout Paradigm:**
- Fluxo de agendamento com steps em linha horizontal no desktop
- Painel com sidebar clara e ícones coloridos por acento
- Cards com padding generoso e separação por espaço, não por borda

**Signature Elements:**
- Avatares circulares grandes para barbeiros
- Ícones preenchidos (não outline) em verde floresta
- Separadores com linha pontilhada fina

**Interaction Philosophy:**
- Hover: elevação suave de card (shadow aumenta)
- Seleção: background verde claro com borda verde escuro
- Transições suaves de 250ms ease-in-out

**Animation:**
- Entrada de elementos: fade-in com scale(0.98 → 1)
- Steps: cross-fade entre passos
- Loading states: skeleton com shimmer dourado

**Typography System:**
- Display: `Cormorant Garamond` (serif elegante para títulos)
- Body: `Nunito Sans` (sans-serif arredondado e amigável)
- Valores: `Nunito Sans` bold
</idea>
<probability>0.09</probability>
</response>
