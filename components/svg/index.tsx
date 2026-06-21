import type { ReactNode, SVGProps } from "react";

export const Icon = ({ children }: { children: ReactNode }) => {
  return children;
};

Icon.Arrow = ({
  height = 24,
  width = 24,
  color = "#fff",
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
        {...rest}
      >
        <path
          d="M19 12L31 24L19 36"
          stroke={color}
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
  color = "#ef4444",
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
        {...rest}
      >
        <path
          d="M23.9917 6H6V42H24"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M33 33L42 24L33 15"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 23.9917H42"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  });
