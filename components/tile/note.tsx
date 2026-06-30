import { useState, useCallback } from "react";
import { TextArea } from "../input";
import type { NoteValue, NoteValueType } from "./types";
import { NoteTitles, NoteOrders, NoteUnOrders } from "./types";
import { mergeClassNames } from "../std/util";
import "./index.scss";
import { EditButton } from "./note/edit";

export interface NoteTileProps {
  value: NoteValue[];
  onChange?: (value: NoteValue[]) => void;
}

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

export const NoteTile = ({ value, onChange }: NoteTileProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const handleInsert = useCallback(
    (index: number, type: NoteValueType) => {
      const newValue = [...value];
      newValue.splice(index, 0, { type, value: "" });
      onChange?.(newValue);
      setEditingIndex(index);
    },
    [value, onChange],
  );

  const handleValueChange = useCallback(
    (index: number, newValue: string) => {
      const newArr = [...value];
      newArr[index] = { ...newArr[index], value: newValue };
      onChange?.(newArr);
    },
    [value, onChange],
  );

  const handleLineClick = useCallback((index: number) => {
    setEditingIndex(index);
  }, []);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target === e.currentTarget ||
        target.classList.contains("note_tile__empty")
      ) {
        const newIndex = value.length;
        handleInsert(newIndex, "text");
      }
    },
    [value.length, handleInsert],
  );

  return (
    <div
      className={mergeClassNames("note_tile")()}
      onClick={handleContainerClick}
    >
      {value.map((item, index) => {
        const className = classNames.get(item.type) ?? "text";
        const isEditing = editingIndex === index;

        return (
          <div
            key={index}
            className={mergeClassNames("line")(
              isEditing ? "line--editing" : "",
            )}
            // onMouseEnter={() => setHoverIndex(index)}
            // onMouseLeave={() => setHoverIndex(null)}
          >
            {isEditing && (
              <div
                className={mergeClassNames("line__edit-btn")()}
                onClick={(e) => e.stopPropagation()}
              >
                <EditButton onInsert={(type) => handleInsert(index, type)} />
              </div>
            )}
            <div
              className={mergeClassNames("line__content")()}
              onClick={() => handleLineClick(index)}
            >
              {isEditing ? (
                <TextArea
                  block
                  bordered={false}
                  value={item.value}
                  className={mergeClassNames("line__textarea")(className)}
                  autoSize
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  onBlur={() => setEditingIndex(null)}
                />
              ) : (
                <p className={className}>{item.value || " "}</p>
              )}
            </div>
          </div>
        );
      })}
      {value.length === 0 && (
        <div className={mergeClassNames("note_tile__empty")()}>
          点击添加内容...
        </div>
      )}
    </div>
  );
};
