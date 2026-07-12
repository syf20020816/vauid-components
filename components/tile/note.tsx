import type { ReactNode } from "react";
import { mergeClassNames } from "../std/util";
import Markdown from "react-markdown";
import "./index.scss";

export interface NoteTileProps {
  value?: string;
  children?: ReactNode;
}

/**
 * 说明卡片
 * 一个最基础的说明卡片组件用于展示说明信息，你可以自定义卡片内容，如果不想自定义，该卡片展示Markdown文本
 * @param param0
 * @returns
 */
export const NoteTile = ({ value, children }: NoteTileProps) => {
  return (
    <div className={mergeClassNames("basic_tile")()}>
      {children ? children : <Markdown>{value}</Markdown>}
    </div>
  );
};
