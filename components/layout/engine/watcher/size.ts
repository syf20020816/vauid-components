import type { Nullable } from "../../../_std";

/**
 * # LayoutSizeWatcher - 布局尺寸监视器
 * 使用 ResizeObserver 监听容器尺寸变化，只负责监听和报告尺寸
 * 不存储任何状态，容器和尺寸均由外部传入
 */
export class LayoutSizeWatcher {
  /** ResizeObserver 实例 */
  private resizeObserver: Nullable<ResizeObserver> = null;
  /** 防抖定时器 */
  private resizeTimer: Nullable<ReturnType<typeof setTimeout>> = null;
  /** 防抖延迟 (ms) */
  private resizeDebounceMs: number;

  /** 尺寸变化回调，由 Engine 设置 */
  onResize: Nullable<(width: number, height: number) => void> = null;

  constructor(options?: { resizeDebounceMs?: number }) {
    this.resizeDebounceMs = options?.resizeDebounceMs ?? 20;
  }

  /** 开始监听容器的行为 */
  watch(container: HTMLElement) {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          this.handleResize(container, entry.contentRect.width, entry.contentRect.height);
          break;
        }
      }
    });

    this.resizeObserver.observe(container);
  }

  /** 停止监听 */
  unwatch() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
    this.onResize = null;
  }

  /** 处理尺寸变化（带防抖） */
  private handleResize(_container: HTMLElement, width: number, height: number) {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }

    this.resizeTimer = setTimeout(() => {
      this.onResize?.(width, height);
    }, this.resizeDebounceMs);
  }
}
