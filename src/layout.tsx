import { Page } from "../components/layout/__tests__/layout";
import { Button } from "../components/button";
import { LeaveButton } from "../components/controller/leave";
import { Controller } from "../components/controller";
import { Toggle } from "../components/toggle/index";
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
        <Toggle
          options={[
            { label: "Option 1", value: "1" },
            { label: "Option 2", value: "2" },
            { label: "Option 3", value: "3" },
          ]}
        />
      </div>
    );
  } else if (tab === "tile") {
    return <NoteTile value={[
      {
        type: "t1",
        value: "Note Title",
      },
      {
        type: "text",
        value: "Hello World",
      },
    ]} />;
  }
};
