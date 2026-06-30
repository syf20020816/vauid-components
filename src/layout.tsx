import { Page } from "../components/layout/__tests__/layout";
import { Button } from "../components/button";
import { LeaveButton } from "../components/controller/leave";
import { Controller } from "../components/controller";
import { Trigger } from "../components/trigger/index";
import { NoteTile } from "../components/tile/note";

const flexCenter = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  height: "100vh",
  gap: 12,
};

/**
 * URL：
 * 1. /?tab=btn
 * 2. /?tab=page
 * 3. /?tab=other
 * @param param0
 * @returns
 */
export const TabPage = ({
  searchParams,
}: {
  searchParams?: URLSearchParams;
}) => {
  const params = searchParams ?? new URLSearchParams(window.location.search);
  const tab = params.get("tab");

  if (!tab) {
    return (
      <>
        <Page />
        <Controller position="center" />
      </>
    );
  } else if (tab === "ctr") {
    return (
      <div style={flexCenter}>
        <Controller />
      </div>
    );
  } else if (tab === "btn") {
    return (
      <div style={flexCenter}>
        <LeaveButton />
        <Button>Vauid Btn</Button>
        <Trigger
          options={[
            { label: "Option 1", value: "1" },
            { label: "Option 2", value: "2" },
            { label: "Option 3", value: "3" },
          ]}
        />
      </div>
    );
  } else if (tab === "tile") {
    return (
      <div
        style={{
          height: 400,
          width: 300,
          backgroundColor: "#2e2e2eff",
        }}
      >
        <NoteTile
          value={[
            {
              type: "t1",
              value: "房间公告！",
            },
            {
              type: "text",
              value: "房间公告内容：这是一个房间公告，用于通知房间中的玩家。",
            },
          ]}
        />
      </div>
    );
  }
};
