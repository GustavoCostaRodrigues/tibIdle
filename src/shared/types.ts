export type LayoutMode = 'grid-2x2' | 'layout-1x3' | 'maximized';

export interface AccountConfig {
  id: string; // ex: 'account_01'
  name: string; // ex: '01'
  partition: string; // ex: 'persist:tibidle_01'
  url: string;
}

export interface WindowMetrics {
  cpuUsage: number;
  memoryUsageMb: number;
}

export interface SystemInfo {
  platform: 'darwin' | 'win32' | 'linux';
  version: string;
}

export interface IElectronAPI {
  // Controle da Janela
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;

  // Informações do Sistema
  getSystemInfo: () => Promise<SystemInfo>;
  getMetrics: () => Promise<WindowMetrics>;

  // Evento de janela
  onWindowStateChange: (callback: (isMaximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
