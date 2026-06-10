import type { Nullable } from "../../../_std";
import type { EngineCallback } from "../../types";

interface WatcherState {
  height: number;
  width: number;
}

/**
 * # LayoutSizeWatcher - 布局尺寸监视器
 * 使用 ResizeObserver 监听容器尺寸变化，当容器尺寸出现变化时触发计算，布局尺寸监视器只负责监听容器尺寸变化
 */
export class LayoutSizeWatcher {
  /** 当容器尺寸变化时触发的回调函数 */
  private callback: Nullable<EngineCallback> = null;
  /** 外部容器引用，用于获取容器尺寸，对容器进行监听 */
  private container: HTMLElement;
  /** ResizeObserver 实例 */
  private resizeObserver: Nullable<ResizeObserver> = null;
  /** 防抖定时器 */
  private resizeTimer: Nullable<ReturnType<typeof setTimeout>> = null;
  /** 防抖延迟 (ms) */
  private resizeDebounceMs: number = 20;

  private state: WatcherState = {
    height: 0,
    width: 0,
  };

  constructor(container: HTMLElement, options?: { resizeDebounceMs?: number }) {
    this.container = container;
    this.resizeDebounceMs = options?.resizeDebounceMs ?? 20;
    this.updateSize(); // 立即更新尺寸，确保初始尺寸正确
  }

  /** 开始监听容器的行为 */
  watch() {
    // 初始化尺寸
    this.updateSize();

    // 创建 ResizeObserver 监听容器尺寸变化
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.container) {
          this.handleResize();
          break;
        }
      }
    });

    this.resizeObserver.observe(this.container);
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
  }

  /** 更新容器尺寸 */
  private updateSize() {
    const { height, width } = this.container.getBoundingClientRect();
    this.state.height = height;
    this.state.width = width;
  }

  /** 处理尺寸变化（带防抖） */
  private handleResize() {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }

    this.resizeTimer = setTimeout(() => {
      this.updateSize();
      this.onResize();
    }, this.resizeDebounceMs);
  }

  onResize() {
    this.callback?.();
  }

  set(callback: EngineCallback) {
    this.callback = callback;
  }

  delete() {
    this.callback = null;
  }

  /** 获取当前容器尺寸 */
  getSize() {
    return { ...this.state };
  }

  /** alias for getSize() */
  getState() {
    return this.getSize();
  }
}
