# TibIdle Manager

Gerenciador desktop de alta performance em **Grid 2x2** e **Layout 1x3** para o jogo **[TibIdle](https://tibidle.com)**, projetado para executar nativamente no **macOS** e **Windows**. Permite gerenciar até **4 contas simultâneas** em uma única interface limpa, ultra-rápida e moderna, com isolamento estrito de sessões.

---

## 🚀 Funcionalidades

### 1. Isolamento Estrito de Sessões (Electron Partitioning)
- Cada quadrante executa com partição independente:
  - `persist:tibidle_01`
  - `persist:tibidle_02`
  - `persist:tibidle_03`
  - `persist:tibidle_04`
- Cookies, cache, login e localStorage completamente separados por conta.

### 2. Layouts Dinâmicos (Zero-Reload)
- **Grade 2x2**: 4 quadrantes perfeitamente divididos.
- **Layout 1x3**: 1 conta em destaque à esquerda com barra lateral arrastável (splitter) e 3 contas secundárias. Clique em qualquer card lateral para torná-lo o card principal sem recarregar!
- **Modo Maximizar**: expanda qualquer quadrante para tela cheia dentro do app.

### 3. Controles Individuais por Slot
- **Controle de Escala (Zoom)**: botões de `-` e `+` com ajuste de 40% a 200%, lembrado automaticamente para cada conta.
- **Mutar Áudio**: mute independente de efeitos sonoros.
- **Recarregar**: botão de recarga individual por slot ou geral no topo.
- **Telemetria de Sistema**: monitoramento em tempo real de CPU e memória RAM.

---

## 🛠️ Como Executar

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar em modo de desenvolvimento (com auto-reload)
npm run dev

# 3. Compilar e iniciar
npm start

# 4. Gerar instalador para seu sistema operacional
npm run dist:mac  # macOS
npm run dist:win  # Windows
```
