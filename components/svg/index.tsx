import type { ReactNode, SVGProps } from "react";

export const Icon = ({ children }: { children: ReactNode }) => {
  return children;
};

Icon.Arrow = ({
  height = 24,
  width = 24,
  color = "currentColor",
  strokeWidth = 4,
  ...rest
}: SVGProps<SVGSVGElement>) =>
  Icon({
    children: (
      <svg
        width={width}
        height={height}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        color={color}
        {...rest}
      >
        <path
          d="M19 12L31 24L19 36"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  });

Icon.Leave = ({
  height = 24,
  width = 24,
  color,
  strokeWidth = 4,
  ...rest
}: SVGProps<SVGSVGElement>) =>
  Icon({
    children: (
      <svg
        width={width}
        height={height}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        color={color}
        {...rest}
      >
        <path
          d="M23.9917 6H6V42H24"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M33 33L42 24L33 15"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 23.9917H42"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  });
