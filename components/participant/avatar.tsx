import { type HTMLAttributes, useMemo } from "react";
import { useCls } from "../std/hooks/cls";
import "./index.scss";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: number;
  src?: string;
}

const AVATAR_COLORS = [
  "#ff5c00",
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitial(name: string): string {
  if (!name) return "?";
  const trimmed = name.trim();
  // If the first character is a Latin letter, uppercase it
  // Otherwise (Chinese, digits, etc.) return it as-is
  const first = trimmed[0];
  if (/[a-zA-Z]/.test(first)) {
    return first.toUpperCase();
  }
  return first;
}

export const Avatar = ({
  name,
  size = 40,
  src,
  className,
  style,
  ...props
}: AvatarProps) => {
  const bgColor = useMemo(
    () => AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length],
    [name],
  );

  const initial = useMemo(() => getInitial(name), [name]);

  const { cls } = useCls("avatar", className);

  return (
    <div
      className={cls}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        backgroundColor: src ? "transparent" : bgColor,
        ...style,
      }}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} />
      ) : (
        <span style={{ color: "#fff" }}>{initial}</span>
      )}
    </div>
  );
};
