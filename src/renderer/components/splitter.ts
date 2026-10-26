export class LayoutSplitterComponent {
  public readonly element: HTMLElement;
  private isDragging = false;
  private currentWidth = 360;

  private cachedRight = 0;
  private cachedMaxSidebarWidth = 360;
  private rafId: number | null = null;
  private pendingWidth: number | null = null;

  private readonly boundMouseMove = (e: MouseEvent) => this.handleMouseMove(e);
  private readonly boundMouseUp = () => this.handleMouseUp();

  private static readonly STORAGE_KEY = 'tibidle_sidebar_width';
  private static readonly DEFAULT_WIDTH = 360;
  private static readonly MIN_WIDTH = 180;

  constructor(
    private readonly container: HTMLElement,
    private readonly onResize?: (newWidth: number) => void,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'layout-splitter';
    this.element.id = 'layout-splitter';
    this.element.setAttribute('role', 'separator');
    this.element.setAttribute('aria-orientation', 'vertical');
    this.element.title = 'Arraste para ajustar a coluna lateral (Duplo clique para redefinir)';

    this.element.innerHTML = `
      <div class="splitter-handle">
        <div class="splitter-grip"></div>
      </div>
    `;

    this.loadInitialWidth();
    this.initEvents();
  }

  private loadInitialWidth(): void {
    const saved = localStorage.getItem(LayoutSplitterComponent.STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= LayoutSplitterComponent.MIN_WIDTH) {
        this.currentWidth = parsed;
      }
    }
    this.applyWidth(this.currentWidth, false);
  }

  private applyWidth(width: number, save = false): void {
    this.currentWidth = width;
    this.container.style.setProperty('--sidebar-width', `${width}px`);
    if (save) {
      localStorage.setItem(LayoutSplitterComponent.STORAGE_KEY, String(width));
    }
    this.onResize?.(width);
  }

  private initEvents(): void {
    this.element.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      this.startDragging(e);
    });

    this.element.addEventListener('dblclick', () => {
      this.applyWidth(LayoutSplitterComponent.DEFAULT_WIDTH, true);
    });
  }

  private startDragging(e: MouseEvent): void {
    this.isDragging = true;
    this.element.classList.add('is-dragging');
    document.body.classList.add('is-resizing-splitter');

    const rect = this.container.getBoundingClientRect();
    this.cachedRight = rect.right;
    this.cachedMaxSidebarWidth = Math.max(LayoutSplitterComponent.MIN_WIDTH, rect.width - 320);

    window.addEventListener('mousemove', this.boundMouseMove, { passive: true });
    window.addEventListener('mouseup', this.boundMouseUp);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const rawWidth = this.cachedRight - e.clientX;
    const clamped = Math.max(
      LayoutSplitterComponent.MIN_WIDTH,
      Math.min(this.cachedMaxSidebarWidth, rawWidth)
    );

    this.pendingWidth = clamped;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        if (this.pendingWidth !== null) {
          this.applyWidth(this.pendingWidth, false);
          this.pendingWidth = null;
        }
        this.rafId = null;
      });
    }
  }

  private handleMouseUp(): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.pendingWidth !== null) {
      this.applyWidth(this.pendingWidth, true);
      this.pendingWidth = null;
    } else {
      localStorage.setItem(LayoutSplitterComponent.STORAGE_KEY, String(this.currentWidth));
    }

    this.element.classList.remove('is-dragging');
    document.body.classList.remove('is-resizing-splitter');

    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseup', this.boundMouseUp);
  }
}
