import { Tag, type TagProps } from "../tag";
import { Icon } from "../svg";

export interface ParticipantNumProps extends Omit<TagProps, "children"> {
  count: number;
}

export const ParticipantNum = ({ count, ...props }: ParticipantNumProps) => {
  return (
    <Tag round icon={<Icon.Users width={14} height={14} />} {...props}>
      {count}
    </Tag>
  );
};
