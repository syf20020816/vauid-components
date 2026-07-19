import { Tag, type TagProps } from "../tag";
import { type CSSProperties } from "react";
import { DEFAULT_COLORS } from "../style/global";

export type RoleType = "host" | "participant" | "manager" | "guest";

export interface RoleProps extends Omit<TagProps, "children"> {
  role?: RoleType;
  text?: string;
  color?: CSSProperties["color"];
  backgroundColor?: CSSProperties["backgroundColor"];
}

const ROLE_CONFIG: Record<
  RoleType,
  { text: string; color: string; backgroundColor: string; borderColor: string }
> = {
  host: {
    text: "主持人",
    color: DEFAULT_COLORS.error.text,
    backgroundColor: DEFAULT_COLORS.error.plain,
    borderColor: DEFAULT_COLORS.error.border,
  },
  participant: {
    text: "参会者",
    color: DEFAULT_COLORS.info.text,
    backgroundColor: DEFAULT_COLORS.info.plain,
    borderColor: DEFAULT_COLORS.info.border,
  },
  manager: {
    text: "管理员",
    color: DEFAULT_COLORS.warning.text,
    backgroundColor: DEFAULT_COLORS.warning.plain,
    borderColor: DEFAULT_COLORS.warning.border,
  },
  guest: {
    text: "游客",
    color: DEFAULT_COLORS.success.text,
    backgroundColor: DEFAULT_COLORS.success.plain,
    borderColor: DEFAULT_COLORS.success.border,
  },
};

export const Role = ({
  role,
  text,
  color,
  backgroundColor,
  ...props
}: RoleProps) => {
  const config = role ? ROLE_CONFIG[role] : null;
  const displayText = text ?? config?.text ?? "ROLE";
  const displayColor = color ?? config?.color;
  const displayBgColor = backgroundColor ?? config?.backgroundColor;
  const displayBorderColor =
    config?.borderColor ?? DEFAULT_COLORS.borderDefault;

  return (
    <Tag
      {...props}
      style={{
        color: displayColor,
        backgroundColor: displayBgColor,
        borderColor: displayBorderColor,
        ...props.style,
      }}
    >
      {displayText}
    </Tag>
  );
};
