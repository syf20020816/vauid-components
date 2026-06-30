import { Dropdown } from "../../dropdown";
import { Icon } from "../../svg";
import type { NoteValueType } from "../types";
import { NoteTitles, NoteOrders, NoteUnOrders } from "../types";
import { mergeClassNames } from "../../std/util";
import { Button } from "../../button";

export interface EditButtonProps {
  onInsert: (type: NoteValueType) => void;
  className?: string;
}

const menuItems: { key: NoteValueType; label: string }[] = [
  { key: "text", label: "正文" },
  { key: NoteTitles.T1, label: "标题 1" },
  { key: NoteTitles.T2, label: "标题 2" },
  { key: NoteTitles.T3, label: "标题 3" },
  { key: NoteUnOrders.U1, label: "无序列表 1" },
  { key: NoteUnOrders.U2, label: "无序列表 2" },
  { key: NoteUnOrders.U3, label: "无序列表 3" },
  { key: NoteOrders.O1, label: "有序列表 1" },
  { key: NoteOrders.O2, label: "有序列表 2" },
  { key: NoteOrders.O3, label: "有序列表 3" },
];

export const EditButton = ({ onInsert, className }: EditButtonProps) => {
  return (
    <div className={mergeClassNames("edit-button")(className)}>
      <Dropdown
        trigger="click"
        placement="right"
        items={menuItems.map((item) => ({
          key: item.key,
          label: item.label,
          onClick: () => onInsert(item.key),
        }))}
      >
        <Button
          icon={<Icon.Add height={16} width={16} strokeWidth={2} />}
          className={mergeClassNames("edit-button__trigger")()}
        ></Button>
      </Dropdown>
    </div>
  );
};
