import { Tag, type TagProps } from "../tag";
import { Icon } from "../svg";
import { useCls } from "../std/hooks/cls";

export interface ParticipantNumProps extends Omit<TagProps, "children"> {
  count: number;
}

export const ParticipantNum = ({ count, ...props }: ParticipantNumProps) => {
  const { cls } = useCls("participant-num");

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
