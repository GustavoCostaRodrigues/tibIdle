import { AccountManager } from './components/accountManager.js';
import { TitleBarComponent } from './components/titleBar.js';
import { ToastManager } from './components/toast.js';

class TibIdleApp {
  private accountManager!: AccountManager;
  private titleBar!: TitleBarComponent;
  private toastManager = new ToastManager();

  constructor() {
    this.init();
  }

  private init(): void {
    const container = document.getElementById('accounts-container');
    if (!container) throw new Error('Container #accounts-container não encontrado.');

    // Inicializa a barra de título
    this.titleBar = new TitleBarComponent(
      (mode) => {
        this.accountManager.setLayout(mode);
      },
      () => {
        this.accountManager.reloadAll();
        this.toastManager.show('Todas as contas foram recarregadas', 'info', 2000);
      },
    );

    // Inicializa o gerenciador de contas (4 slots em Grid 2x2)
    this.accountManager = new AccountManager(container, (mode) => {
      this.titleBar.updateLayoutActiveState(mode);
    });

    this.titleBar.updateLayoutActiveState(this.accountManager.getLayout());

    console.log('✔ TibIdle Manager iniciado com sucesso.');
  }
}

// Inicia quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new TibIdleApp();
});
