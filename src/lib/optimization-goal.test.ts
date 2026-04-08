import { describe, expect, it } from "vitest";
import { submissionMatchesGoal } from "./optimization-goal";

describe("submissionMatchesGoal", () => {
  it("maximize_submissions is true when any non-empty field", () => {
    expect(
      submissionMatchesGoal(
        { kind: "maximize_submissions", text: null, fieldKey: null },
        { email: "a@b.co" }
      )
    ).toBe(true);
  });

  it("maximize_field_completion checks field key", () => {
    expect(
      submissionMatchesGoal(
        { kind: "maximize_field_completion", text: null, fieldKey: "company" },
        { email: "a@b.co", company: "Acme" }
      )
    ).toBe(true);
    expect(
      submissionMatchesGoal(
        { kind: "maximize_field_completion", text: null, fieldKey: "company" },
        { email: "a@b.co", company: "" }
      )
    ).toBe(false);
  });
});
