import type { LayoutMode, SystemInfo } from '../../shared/types.js';

export class TitleBarComponent {
  private btnGrid: HTMLButtonElement;
  private btn1x3: HTMLButtonElement;
  private btnReloadAll: HTMLButtonElement | null;
  private metricCpu: HTMLElement;
  private metricRam: HTMLElement;

  private btnMinimize: HTMLButtonElement | null;
  private btnMaximize: HTMLButtonElement | null;
  private btnClose: HTMLButtonElement | null;

  constructor(
    private readonly onLayoutSelect: (mode: LayoutMode) => void,
    private readonly onReloadAll?: () => void,
  ) {
    this.btnGrid = document.getElementById('btn-layout-grid') as HTMLButtonElement;
    this.btn1x3 = document.getElementById('btn-layout-1x3') as HTMLButtonElement;
    this.btnReloadAll = document.getElementById('btn-reload-all') as HTMLButtonElement | null;
    this.metricCpu = document.getElementById('metric-cpu') as HTMLElement;
    this.metricRam = document.getElementById('metric-ram') as HTMLElement;

    this.btnMinimize = document.getElementById('btn-window-minimize') as HTMLButtonElement | null;
    this.btnMaximize = document.getElementById('btn-window-maximize') as HTMLButtonElement | null;
    this.btnClose = document.getElementById('btn-window-close') as HTMLButtonElement | null;

    this.initEvents();
    this.initPlatformStyle();
    this.startMetricsPolling();
  }

  private initEvents(): void {
    this.btnGrid.addEventListener('click', () => {
      this.onLayoutSelect('grid-2x2');
    });

    this.btn1x3.addEventListener('click', () => {
      this.onLayoutSelect('layout-1x3');
    });

    this.btnReloadAll?.addEventListener('click', () => {
      this.onReloadAll?.();
    });

    // Controles de Janela
    this.btnMinimize?.addEventListener('click', () => {
      window.electronAPI?.minimizeWindow();
    });

    this.btnMaximize?.addEventListener('click', () => {
      window.electronAPI?.maximizeWindow();
    });

    this.btnClose?.addEventListener('click', () => {
      window.electronAPI?.closeWindow();
    });
  }

  private async initPlatformStyle(): Promise<void> {
    try {
      const info: SystemInfo = await window.electronAPI?.getSystemInfo();
      if (info?.platform === 'darwin') {
        document.body.classList.add('platform-darwin');
      } else {
        document.body.classList.add('platform-windows');
      }
    } catch {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if (isMac) {
        document.body.classList.add('platform-darwin');
      } else {
        document.body.classList.add('platform-windows');
      }
    }
  }

  public updateLayoutActiveState(mode: LayoutMode): void {
    if (mode === 'grid-2x2') {
      this.btnGrid.classList.add('active');
      this.btnGrid.setAttribute('aria-checked', 'true');
      this.btn1x3.classList.remove('active');
      this.btn1x3.setAttribute('aria-checked', 'false');
    } else if (mode === 'layout-1x3') {
      this.btn1x3.classList.add('active');
      this.btn1x3.setAttribute('aria-checked', 'true');
      this.btnGrid.classList.remove('active');
      this.btnGrid.setAttribute('aria-checked', 'false');
    } else {
      this.btnGrid.classList.remove('active');
      this.btn1x3.classList.remove('active');
    }
  }

  private startMetricsPolling(): void {
    const update = async () => {
      try {
        const metrics = await window.electronAPI?.getMetrics();
        if (metrics) {
          if (this.metricCpu) this.metricCpu.textContent = `${metrics.cpuUsage}%`;
          if (this.metricRam) this.metricRam.textContent = `${metrics.memoryUsageMb} MB`;
        }
      } catch (_) {}
    };

    update();
    setInterval(update, 3000);
  }
}
