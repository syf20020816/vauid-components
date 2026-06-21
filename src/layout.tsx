import { Page } from "../components/layout/__tests__/layout";
import { Button } from "../components/button";
import { LeaveButton } from "../components/controller/leave";
import { Controller } from "../components/controller";
import { Toggle } from "../components/controller/toggle";

const flexCenter = {
  display: "flex",
  alignItems: "center",
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
    return <Page />;
  } else if (tab === "ctr") {
    return<div style={flexCenter}><Controller /></div> ;
  } else if (tab === "btn") {
    return (
      <div style={flexCenter}>
        <LeaveButton />
        <Button>Vauid Btn</Button>
        <Toggle />
      </div>
    );
  } else {
    return <Page />;
  }
};
