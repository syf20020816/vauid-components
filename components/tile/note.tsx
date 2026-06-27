import { useState } from "react";
import { Input } from "../input";
import { NoteOrders, NoteTitles, NoteUnOrders, type NoteValue, type NoteValueType } from "./types";

export interface NoteTileProps {
  value: NoteValue[];
}

/**
 * # NoteTile - 便条/通知组件
 * 用于显示房间中的便条/通知，通常这是一个常驻组件
 */
export const NoteTile = ({ value }: NoteTileProps) => {
  return (
    <div>
      {value.map((item) => (
        <Line key={item.type} {...item} />
      ))}
    </div>
  );
};

const classNames = new Map<NoteValueType, string>([
  [NoteTitles.T1, "title_t1"],
  [NoteTitles.T2, "title_t2"],
  [NoteTitles.T3, "title_t3"],
  [NoteOrders.O1, "order_o1"],
  [NoteOrders.O2, "order_o2"],
  [NoteOrders.O3, "order_o3"],
  [NoteUnOrders.U1, "unorder_u1"],
  [NoteUnOrders.U2, "unorder_u2"],
  [NoteUnOrders.U3, "unorder_u3"],
  ["text", "text"],
]);

const Line = ({ type, value }: NoteValue) => {
  const [editing, setEditing] = useState(false);

  const className = classNames.get(type) ?? "text";

  return (
    <div
      onClick={() => {
        setEditing(!editing);
      }}
    >
      <Input value={value} className={className} disabled={editing} />
    </div>
  );
};
