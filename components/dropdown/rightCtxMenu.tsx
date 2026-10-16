import { Dropdown, type DropdownProps } from "./index";

export interface RightCtxMenuProps extends Omit<DropdownProps, "trigger"> {
  /** 触发方式：contextMenu 右键弹出（默认）/ click 点击展开（适合作为 more 按钮的展开层） */
  trigger?: "contextMenu" | "click";
}

/**
 * # RightCtxMenu - 右键菜单
 * Dropdown 的音视频场景预设：右键宿主元素（参与者列表项、画面、白板等）
 * 弹出操作菜单（静音/设为焦点/移出房间等，items 由使用方传入），
 * 也可通过 trigger="click" 作为 more 按钮的展开层。
 *
 * @example 右键参与者
 * ```tsx
 * <RightCtxMenu items={[{ value: "mute", label: "静音", onClick: mute }]}>
 *   <ParticipantItem name="张三" />
 * </RightCtxMenu>
 * ```
 */
export const RightCtxMenu = ({
  trigger = "contextMenu",
  placement = "bottom",
  ...props
}: RightCtxMenuProps) => {
  return <Dropdown trigger={trigger} placement={placement} {...props} />;
};

RightCtxMenu.displayName = "RightCtxMenu";
