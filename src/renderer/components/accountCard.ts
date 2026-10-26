import type { AccountConfig } from '../../shared/types.js';

export class AccountCardComponent {
  public readonly element: HTMLElement;
  public readonly webview: Electron.WebviewTag;

  private isMaximized = false;
  private isMuted = false;
  private currentZoom = 1.0;

  private loadingOverlay: HTMLElement;
  private errorOverlay: HTMLElement;
  private zoomLevelEl: HTMLElement;
  private muteBtn: HTMLButtonElement;
  private reloadBtn: HTMLButtonElement;
  private maximizeBtn: HTMLButtonElement;
  private statusDot: HTMLElement;

  constructor(
    public readonly config: AccountConfig,
    private readonly onCardClick?: (card: AccountCardComponent) => void,
    private readonly onMaximizeToggle?: (card: AccountCardComponent, isMax: boolean) => void,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'account-card';
    this.element.id = `card-${config.id}`;

    // Carrega preferências salvas
    const savedZoom = localStorage.getItem(`tibidle_zoom_${config.id}`);
    if (savedZoom) {
      const parsed = parseFloat(savedZoom);
      if (!isNaN(parsed) && parsed >= 0.4 && parsed <= 2.0) {
        this.currentZoom = parsed;
      }
    }

    const savedMuted = localStorage.getItem(`tibidle_muted_${config.id}`);
    if (savedMuted === 'true') {
      this.isMuted = true;
    }

    this.element.innerHTML = `
      <div class="card-toolbar">
        <div class="toolbar-left">
          <span class="status-dot online" title="Status da Conta"></span>
          <span class="account-badge">CONTA ${config.name}</span>
        </div>

        <div class="toolbar-right">
          <!-- Controles de Zoom -->
          <div class="zoom-controls" title="Controle de Escala">
            <button class="btn-tool btn-zoom-out" title="Diminuir Zoom">−</button>
            <span class="zoom-level">${Math.round(this.currentZoom * 100)}%</span>
            <button class="btn-tool btn-zoom-in" title="Aumentar Zoom">+</button>
          </div>

          <!-- Áudio Mudo / Desmudo -->
          <button class="btn-tool btn-mute ${this.isMuted ? 'is-muted' : ''}" title="${this.isMuted ? 'Desmutar Áudio' : 'Mutar Áudio'}">
            <svg class="icon-unmuted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            <svg class="icon-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          </button>

          <!-- Recarregar Página -->
          <button class="btn-tool btn-reload" title="Recarregar Conta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>

          <!-- Maximizar / Restaurar Quadrante -->
          <button class="btn-tool btn-maximize" title="Maximizar / Restaurar Quadrante">
            <svg class="icon-maximize" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            <svg class="icon-restore" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14L3 21"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="webview-container">
        <!-- Overlay de Carregamento -->
        <div class="webview-loading-overlay">
          <div class="loading-spinner"></div>
          <span class="loading-text">Carregando TibIdle...</span>
        </div>

        <!-- Overlay de Falha na Conexão -->
        <div class="webview-error-overlay" style="display: none;">
          <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span class="error-title">Falha ao conectar</span>
          <span class="error-desc">Não foi possível carregar o jogo neste slot.</span>
          <button class="btn-retry">Tentar Novamente</button>
        </div>
      </div>
    `;

    this.loadingOverlay = this.element.querySelector('.webview-loading-overlay') as HTMLElement;
    this.errorOverlay = this.element.querySelector('.webview-error-overlay') as HTMLElement;
    this.zoomLevelEl = this.element.querySelector('.zoom-level') as HTMLElement;
    this.muteBtn = this.element.querySelector('.btn-mute') as HTMLButtonElement;
    this.reloadBtn = this.element.querySelector('.btn-reload') as HTMLButtonElement;
    this.maximizeBtn = this.element.querySelector('.btn-maximize') as HTMLButtonElement;
    this.statusDot = this.element.querySelector('.status-dot') as HTMLElement;

    // Criação do elemento <webview> com isolamento estrito de partição
    const webviewContainer = this.element.querySelector('.webview-container') as HTMLElement;
    this.webview = document.createElement('webview') as Electron.WebviewTag;
    this.webview.className = 'account-webview';
    this.webview.setAttribute('partition', config.partition);
    this.webview.setAttribute('src', config.url);
    this.webview.setAttribute('webpreferences', 'backgroundThrottling=no, contextIsolation=yes');
    this.webview.setAttribute('allowpopups', 'false');
    webviewContainer.appendChild(this.webview);

    this.setupEvents();
  }

  private setupEvents(): void {
    // Foco ao clicar no card (Modo 1x3)
    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.card-toolbar') || target.closest('button')) return;
      this.onCardClick?.(this);
    });

    // Zoom Out
    this.element.querySelector('.btn-zoom-out')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustZoom(-0.1);
    });

    // Zoom In
    this.element.querySelector('.btn-zoom-in')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustZoom(0.1);
    });

    // Reset de Zoom ao clicar na porcentagem
    this.zoomLevelEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setZoom(1.0);
    });

    // Mudo / Desmudo de Áudio
    this.muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMute();
    });

    // Recarregar
    this.reloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.reload();
    });

    // Maximizar / Restaurar
    this.maximizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMaximize();
    });

    // Botão de Retry de erro
    this.errorOverlay.querySelector('.btn-retry')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.errorOverlay.style.display = 'none';
      this.loadingOverlay.style.display = 'flex';
      this.reload();
    });

    // Eventos do ciclo de vida do Webview
    this.webview.addEventListener('did-start-loading', () => {
      this.loadingOverlay.style.display = 'flex';
      this.errorOverlay.style.display = 'none';
      this.statusDot.className = 'status-dot loading';
      this.reloadBtn.classList.add('is-spinning');
    });

    this.webview.addEventListener('dom-ready', () => {
      // Aplica configurações salvas
      try {
        this.webview.setZoomFactor(this.currentZoom);
        this.webview.setAudioMuted(this.isMuted);
      } catch (_) {}
    });

    this.webview.addEventListener('did-stop-loading', () => {
      this.loadingOverlay.style.display = 'none';
      this.reloadBtn.classList.remove('is-spinning');
      this.statusDot.className = 'status-dot online';
    });

    this.webview.addEventListener('did-fail-load', (e: any) => {
      // Ignora cancelamentos (-3)
      if (e.errorCode === -3) return;
      this.loadingOverlay.style.display = 'none';
      this.errorOverlay.style.display = 'flex';
      this.statusDot.className = 'status-dot error';
      this.reloadBtn.classList.remove('is-spinning');
    });
  }

  public setZoom(zoom: number): void {
    const clamped = Math.max(0.4, Math.min(2.0, Math.round(zoom * 10) / 10));
    this.currentZoom = clamped;
    this.zoomLevelEl.textContent = `${Math.round(clamped * 100)}%`;
    try {
      this.webview.setZoomFactor(clamped);
    } catch (_) {}
    localStorage.setItem(`tibidle_zoom_${this.config.id}`, String(clamped));
  }

  public adjustZoom(delta: number): void {
    this.setZoom(this.currentZoom + delta);
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    try {
      this.webview.setAudioMuted(this.isMuted);
    } catch (_) {}
    this.muteBtn.classList.toggle('is-muted', this.isMuted);
    this.muteBtn.title = this.isMuted ? 'Desmutar Áudio' : 'Mutar Áudio';
    localStorage.setItem(`tibidle_muted_${this.config.id}`, String(this.isMuted));
  }

  public reload(): void {
    try {
      this.webview.reload();
    } catch (_) {}
  }

  public toggleMaximize(): void {
    this.setMaximized(!this.isMaximized);
    this.onMaximizeToggle?.(this, this.isMaximized);
  }

  public setMaximized(maximized: boolean): void {
    this.isMaximized = maximized;
    this.element.classList.toggle('is-maximized', maximized);
    this.maximizeBtn.classList.toggle('active', maximized);
    this.maximizeBtn.title = maximized ? 'Restaurar Quadrante' : 'Maximizar Quadrante';
  }
}
