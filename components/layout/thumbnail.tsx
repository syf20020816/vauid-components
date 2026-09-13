import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Button } from "../button";
import { Dropdown, type DropdownProps, type DropdownRef } from "../dropdown";
import { useCls } from "../std/hooks/cls";
import "./index.scss";
import { LayoutDashboard } from "lucide-react";
import { LifeTimes, LayoutTypes, type LayoutType } from "./types";
import type { FnReturn } from "vauid-components/std";
import { useRoomCtx } from "vauid-components/std/ctx/hooks";

export interface ThumbnailProps extends DropdownProps {
  showLabel?: boolean;
  onLayoutChange?: (layout: LayoutType) => FnReturn<void>;
}

/**
 * 布局缩略图用于展示各种布局效果，用户可以通过选择布局来修改组件的布局方式
 */
export const Thumbnail = ({
  showLabel = false,
  classNames,
  direction = "vertical",
  onLayoutChange,
  ...props
}: ThumbnailProps) => {
  const { cls } = useCls("thumbnail", classNames?.dropdown);
  const dropdownRef = useRef<DropdownRef>(null);
  const [popupClassName, setPopupClassName] = useState("");
  const [popupItemClassName, setPopupItemClassName] = useState("");
  const ctx = useRoomCtx();
  // 引擎是命令式对象，改 layoutType/fullScreen 不会触发 React 重渲染：
  // 用 state 镜像选中态，订阅 onLayoutChange 事件同步（渲染期直读引擎只会拿到旧值）
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(
    () => ctx?.layout.getLayoutType() ?? LayoutTypes.Grid,
  );
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const engine = ctx?.layout;
    if (!engine) return;
    // 注意：引擎生命周期为单槽位回调（on 会整体覆盖），勿与其他订阅方共用 onLayoutChange
    const sync = () => {
      setSelectedLayout(engine.getLayoutType());
      setIsFullScreen(engine.getState().fullScreen === true);
    };
    sync();
    engine.on(LifeTimes.onLayoutChange, sync);
    return () => engine.off(LifeTimes.onLayoutChange);
  }, [ctx?.layout]);

  // 全屏时选中 FullScreen 缩略图（fullScreenFirst 不改 layoutType）
  const currentLayout = isFullScreen ? LayoutTypes.FullScreen : selectedLayout;

  // Dropdown ref 在 commit 阶段才赋值，需同步到 state 以驱动 popup 重新渲染
  useLayoutEffect(() => {
    setPopupClassName(dropdownRef.current?.popupClassName ?? "");
    setPopupItemClassName(dropdownRef.current?.itemClassName ?? "");
  }, [direction]);

  const clickTb = async (layout: LayoutType) => {
    // useRoomCtx 可能返回 null（未在 RoomCtxProvider 内），需防护
    if (layout === LayoutTypes.Grid) {
      ctx?.layout.grid();
    } else if (layout === LayoutTypes.Focus) {
      ctx?.layout.focusFirst();
    } else if (layout === LayoutTypes.FullScreen) {
      ctx?.layout.fullScreenFirst();
    }

    await onLayoutChange?.(layout);
  };

  const popup = (
    <div className={`${cls} ${popupClassName}`}>
      <LayoutFocusTb
        selected={currentLayout === LayoutTypes.Focus}
        className={popupItemClassName}
        onClick={clickTb}
      />
      <LayoutGridTb
        selected={currentLayout === LayoutTypes.Grid}
        className={popupItemClassName}
        onClick={clickTb}
      />
      <LayoutFullScreenTb
        selected={currentLayout === LayoutTypes.FullScreen}
        className={popupItemClassName}
        onClick={clickTb}
      />
    </div>
  );

  return (
    <Dropdown {...props} direction={direction} popup={popup} ref={dropdownRef}>
      <Button icon={<LayoutDashboard size={16} />}>
        {showLabel && <span>布局</span>}
      </Button>
    </Dropdown>
  );
};

interface LayoutTbProps {
  selected?: boolean;
  className?: string;
  onClick?: (layout: LayoutType) => FnReturn<void>;
}

const LayoutFocusTb = ({ selected, className, onClick }: LayoutTbProps) => {
  const { cls, vcls } = useCls(
    ["layout-focus-tb", selected && "layout-focus-tb-selected"],
    className,
  );

  return (
    <div className={cls} onClick={() => onClick?.(LayoutTypes.Focus)}>
      <aside className={vcls("aside")}>
        {Array.from({ length: 4 }, (_, i) => (
          <div className={vcls("aside-item")} key={i}></div>
        ))}
      </aside>
      <main className={vcls("main")}></main>
    </div>
  );
};

const LayoutGridTb = ({ selected, className, onClick }: LayoutTbProps) => {
  const { cls, vcls } = useCls(
    ["layout-grid-tb", selected && "layout-grid-tb-selected"],
    className,
  );

  return (
    <div className={cls} onClick={() => onClick?.(LayoutTypes.Grid)}>
      {Array.from({ length: 4 }, (_, i) => (
        <div className={vcls("aside-item")} key={i}></div>
      ))}
    </div>
  );
};
const LayoutFullScreenTb = ({
  selected,
  className,
  onClick,
}: LayoutTbProps) => {
  const { cls, vcls } = useCls(
    ["layout-fullscreen-tb", selected && "layout-fullscreen-tb-selected"],
    className,
  );

  return (
    <div className={cls} onClick={() => onClick?.(LayoutTypes.FullScreen)}>
      <main className={vcls("main")}></main>
    </div>
  );
};
