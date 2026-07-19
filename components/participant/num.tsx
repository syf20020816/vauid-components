import { Tag, type TagProps } from "../tag";
import { Icon } from "../svg";
import { mergeClassNames } from "../std/util";

export interface ParticipantNumProps extends Omit<TagProps, "children"> {
  count: number;
}

export const ParticipantNum = ({ count, ...props }: ParticipantNumProps) => {
  const cls = mergeClassNames("participant-num")();

  return (
    <Tag
      round
      className={cls}
      icon={<Icon.Users width={14} height={14} />}
      {...props}
    >
      {count}
    </Tag>
  );
};
