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

Icon.Microphone = ({
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
        <rect
          x="16"
          y="4"
          width="16"
          height="28"
          rx="8"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 21V24C10 31.732 16.268 38 24 38V38C31.732 38 38 31.732 38 24V21"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 5V11"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 16H21"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M27 16H32"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 22H21"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M27 22H32"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M24 38V44" stroke="currentColor" strokeWidth={strokeWidth} />
        <path
          d="M16 44H32"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  });

Icon.Volume = ({
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
          d="M24 6V42C17 42 11.7985 32.8391 11.7985 32.8391H6C4.89543 32.8391 4 31.9437 4 30.8391V17.0108C4 15.9062 4.89543 15.0108 6 15.0108H11.7985C11.7985 15.0108 17 6 24 6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path
          d="M32 15L32 15C32.6232 15.5565 33.1881 16.1797 33.6841 16.8588C35.1387 18.8504 36 21.3223 36 24C36 26.6545 35.1535 29.1067 33.7218 31.0893C33.2168 31.7885 32.6391 32.4293 32 33"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M34.2359 41.1857C40.0836 37.6953 44 31.305 44 24C44 16.8085 40.2043 10.5035 34.507 6.97906"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    ),
  });

Icon.Camera = ({
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
        <circle
          cx="24"
          cy="21"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="24"
          cy="21"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <path
          d="M16 43L32 43"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 37V43"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  });

Icon.ScreenShare = ({
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
          d="M21 39C21 30.1634 13.8366 23 5 23"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 39C13 34.5817 9.41828 31 5 31"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.5 41C6.88071 41 8 39.8807 8 38.5C8 37.1193 6.88071 36 5.5 36C4.11929 36 3 37.1193 3 38.5C3 39.8807 4.11929 41 5.5 41Z"
          fill="currentColor"
        />
        <path
          d="M4 16.0566V8H44V40H28.7712"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  });

Icon.Add = ({
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
          d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path
          d="M24 16V32"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 24L32 24"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  });
