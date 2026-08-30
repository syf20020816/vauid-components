import { useRef, useState, useLayoutEffect } from "react";
import { Button } from "../button";
import { Dropdown, type DropdownProps, type DropdownRef } from "../dropdown";
import { useCls } from "../std/hooks/cls";
import "./index.scss";
import { LayoutDashboard } from "lucide-react";
import { LayoutTypes, type LayoutType } from "./types";
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

  // Dropdown ref 在 commit 阶段才赋值，需同步到 state 以驱动 popup 重新渲染
  useLayoutEffect(() => {
    setPopupClassName(dropdownRef.current?.popupClassName ?? "");
    setPopupItemClassName(dropdownRef.current?.itemClassName ?? "");
  }, [direction]);

  const clickTb = async (layout: LayoutType) => {
    ctx.layout.setLayoutType(layout);
    onLayoutChange?.(layout);
  };

  const popup = (
    <div className={`${cls} ${popupClassName}`}>
      <LayoutFocusTb className={popupItemClassName} onClick={clickTb} />
      <LayoutGridTb className={popupItemClassName} onClick={clickTb} />
      <LayoutFullScreenTb className={popupItemClassName} onClick={clickTb} />
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
  className?: string;
  onClick?: (layout: LayoutType) => FnReturn<void>;
}

const LayoutFocusTb = ({ className, onClick }: LayoutTbProps) => {
  const { cls, vcls } = useCls("layout-focus-tb", className);

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
const LayoutGridTb = ({ className, onClick }: LayoutTbProps) => {
  const { cls, vcls } = useCls("layout-grid-tb", className);

  return (
    <div className={cls} onClick={() => onClick?.(LayoutTypes.Grid)}>
      {Array.from({ length: 4 }, (_, i) => (
        <div className={vcls("aside-item")} key={i}></div>
      ))}
    </div>
  );
};
const LayoutFullScreenTb = ({ className, onClick }: LayoutTbProps) => {
  const { cls, vcls } = useCls("layout-fullscreen-tb", className);

  return (
    <div className={cls} onClick={() => onClick?.(LayoutTypes.FullScreen)}>
      <main className={vcls("main")}></main>
    </div>
  );
};
