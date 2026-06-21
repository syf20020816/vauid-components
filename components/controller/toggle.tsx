import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { Button } from "../button";
import { Icon } from "../svg";
import { mergeClassNames } from "../_std/util";
import "./toggle.scss";

export const Toggle = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          iconPosition="right"
          icon={
            <Icon.Arrow
              height={16}
              width={16}
              strokeWidth={2}
              style={{
                transform: "rotate(90deg)",
              }}
            />
          }
        >
          Toggle
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={mergeClassNames("dropdown-content")()}
        sideOffset={4}
      >
        <DropdownMenuItem
          className={mergeClassNames("dropdown-item")()}
        >
          Option 1
        </DropdownMenuItem>
        <DropdownMenuItem
          className={mergeClassNames("dropdown-item")()}
        >
          Option 2
        </DropdownMenuItem>
        <DropdownMenuItem
          className={mergeClassNames("dropdown-item")()}
        >
          Option 3
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
