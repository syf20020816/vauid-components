import { describe, expect, it } from "vitest";
import { mergeClassNames } from "../components/_std/util";

describe("should merge class names", () => {
  it("single class name", () => {
    const className = mergeClassNames("leave-button")("other-class");
    expect(className).toBe("vauid-leave-button other-class");
  });

  it("level class name", () => {
    const className = mergeClassNames("leave-button")(
      mergeClassNames("other")("more"),
    );
    expect(className).toBe("vauid-leave-button vauid-other more");
  });
});
