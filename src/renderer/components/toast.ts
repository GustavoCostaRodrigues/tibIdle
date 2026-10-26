export type ToastType = 'info' | 'success' | 'warning' | 'error';

export class ToastManager {
  private container: HTMLElement;

  constructor() {
    let el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-container';
      el.className = 'toast-container';
      document.body.appendChild(el);
    }
    this.container = el;
  }

  public show(message: string, type: ToastType = 'info', durationMs = 3200): void {
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    const iconMap: Record<ToastType, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '🛑',
    };

    toast.innerHTML = `
      <span class="toast-icon">${iconMap[type]}</span>
      <span class="toast-message">${message}</span>
    `;

    this.container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.classList.add('is-hiding');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, durationMs);
  }
}
