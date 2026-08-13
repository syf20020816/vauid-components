import { Icon } from "../svg";
import { useCls } from "../std/hooks/cls";
import { Trigger, type TriggerProps } from "../trigger";

export interface ParticipantNumProps extends TriggerProps {
  count?: number;
}

const copyInvite = () => {
  navigator.clipboard.writeText(window.location.href);
};

export const ParticipantNum = ({
  count = 1,
  ...props
}: ParticipantNumProps) => {
  const { cls, vcls } = useCls("participant-num");

  const countText = count > 99 ? "99+" : count.toString();
  const options = props.options ?? [
    {
      label: "Invite",
      value: "invite",
      icon: <Icon.Invite />,
    },
    {
      label: "Copy Invite Link",
      value: "copyInvite",
      icon: <Icon.Link />,
      onClick: () => copyInvite(),
    },
  ];

  return (
    <Trigger
      classNames={{ trigger: cls }}
      showLabel={false}
      prefix={
        <div className={vcls("icon")}>
          <Icon.Users height={16} width={16} />
          <sup className={vcls("count")}>{countText}</sup>
        </div>
      }
      options={options}
      {...props}
    />
  );
};
