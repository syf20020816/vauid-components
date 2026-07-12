import { Button, type ButtonProps } from "../button";
import { Icon } from "../svg";

export interface ParticipantNumProps extends Omit<ButtonProps, "children"> {
  count: number;
}

export const ParticipantNum = ({
  count,
  ...props
}: ParticipantNumProps) => {
  return (
    <Button icon={<Icon.Users width={16} height={16} />} {...props}>
      {count}
    </Button>
  );
};
