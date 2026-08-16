import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  // 引用 vauid-components 源码目录（组件库未发布 dist，直接编译 TSX/SCSS 源码）
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "vauid-components": resolve(__dirname, "../../components"),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      "vauid-components": resolve(__dirname, "../../components"),
    },
  },
  // 组件库依赖的运行时包需要被编译
  transpilePackages: [
    "@rc-component/trigger",
    "@rc-component/util",
    "lucide-react",
    "react-markdown",
  ],
};

export default nextConfig;
