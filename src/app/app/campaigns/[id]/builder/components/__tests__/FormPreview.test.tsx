// @vitest-environment node
/**
 * Tests for FormPreview and ViewportToggle components.
 *
 * Component rendering tests (marked with // @vitest-environment jsdom) require:
 *   - jsdom or happy-dom installed as a dev dependency
 *   - @testing-library/react installed
 *   - vitest config updated with environment: "jsdom"
 *
 * Pure logic tests (VIEWPORT_WIDTHS constants, evaluateVisibility) run in any environment.
 */

import { describe, it, expect } from "vitest";
import { VIEWPORT_WIDTHS } from "../FormPreview";
import { evaluateVisibility } from "@capturely/shared-forms";
import type { FormField } from "@capturely/shared-forms";

// ─── VIEWPORT_WIDTHS constants ────────────────────────────────────────────────

describe("VIEWPORT_WIDTHS", () => {
  it("desktop is 1024px", () => {
    expect(VIEWPORT_WIDTHS.desktop).toBe(1024);
  });

  it("tablet is 768px", () => {
    expect(VIEWPORT_WIDTHS.tablet).toBe(768);
  });

  it("mobile is 375px", () => {
    expect(VIEWPORT_WIDTHS.mobile).toBe(375);
  });

  it("has exactly three viewport keys", () => {
    expect(Object.keys(VIEWPORT_WIDTHS)).toHaveLength(3);
  });
});

// ─── Scale calculation logic ──────────────────────────────────────────────────

describe("scale calculation", () => {
  function calcScale(available: number, viewport: number): number {
    return Math.min(1, available / viewport);
  }

  it("scales down when container is narrower than viewport", () => {
    expect(calcScale(512, 1024)).toBe(0.5);
  });

  it("caps scale at 1.0 when container is wider than viewport", () => {
    expect(calcScale(1200, 1024)).toBe(1);
  });

  it("returns 1.0 when container exactly matches viewport", () => {
    expect(calcScale(768, 768)).toBe(1);
  });

  it("returns correct scale for mobile viewport", () => {
    expect(calcScale(300, 375)).toBeCloseTo(0.8, 5);
  });
});

// ─── evaluateVisibility integration ──────────────────────────────────────────

describe("evaluateVisibility integration (preview uses empty formValues)", () => {
  const makeField = (overrides: Partial<FormField> = {}): FormField => ({
    fieldId: "f1",
    type: "text",
    label: "Test field",
    ...overrides,
  });

  it("returns true for fields with no visibilityCondition", () => {
    const field = makeField();
    expect(evaluateVisibility(field, {})).toBe(true);
  });

  it("hides field when condition requires a value that is not present", () => {
    const field = makeField({
      visibilityCondition: {
        dependsOn: "otherField",
        operator: "equals",
        value: "yes",
      },
    });
    // With empty formValues, 'otherField' is "" which !== "yes"
    expect(evaluateVisibility(field, {})).toBe(false);
  });

  it("hides field when not_empty condition and value is empty", () => {
    const field = makeField({
      visibilityCondition: {
        dependsOn: "email",
        operator: "not_empty",
      },
    });
    expect(evaluateVisibility(field, {})).toBe(false);
  });

  it("shows field when not_equals condition matches empty string default", () => {
    const field = makeField({
      visibilityCondition: {
        dependsOn: "plan",
        operator: "not_equals",
        value: "enterprise",
      },
    });
    // "" !== "enterprise" → visible
    expect(evaluateVisibility(field, {})).toBe(true);
  });

  it("shows field when formValues satisfy the condition", () => {
    const field = makeField({
      visibilityCondition: {
        dependsOn: "country",
        operator: "equals",
        value: "US",
      },
    });
    expect(evaluateVisibility(field, { country: "US" })).toBe(true);
  });

  it("hides field when contains condition does not match", () => {
    const field = makeField({
      visibilityCondition: {
        dependsOn: "notes",
        operator: "contains",
        value: "urgent",
      },
    });
    expect(evaluateVisibility(field, {})).toBe(false);
  });
});

// ─── Component rendering tests (require DOM environment) ─────────────────────
//
// These tests are scaffolded below. To enable them:
//
//   1. Install dependencies:
//        npm install -D jsdom @testing-library/react @testing-library/user-event
//
//   2. Update vitest.config.ts:
//        environment: "jsdom"
//        OR add // @vitest-environment jsdom at the top of this file
//
//   3. Uncomment the tests below.
//
// ----------------------------------------------------------------------------
//
// import { render, screen } from "@testing-library/react";
// import { FormPreview } from "../FormPreview";
// import { ViewportToggle } from "../ViewportToggle";
// import type { FormSchema } from "@capturely/shared-forms";
//
// const baseStyle = {
//   backgroundColor: "#fff",
//   textColor: "#000",
//   buttonColor: "#3b82f6",
//   buttonTextColor: "#fff",
//   borderRadius: "4px",
//   fontFamily: "sans-serif",
// };
//
// const baseSchema = (fields: FormSchema["fields"]): FormSchema => ({
//   fields,
//   style: baseStyle,
//   submitLabel: "Submit",
// });
//
// describe("FormPreview field rendering", () => {
//   it("renders text input", () => {
//     const schema = baseSchema([{ fieldId: "f1", type: "text", label: "Name" }]);
//     render(<FormPreview schema={schema} campaignType="inline" />);
//     expect(screen.getByRole("textbox")).toBeInTheDocument();
//   });
//
//   it("renders email input", () => {
//     const schema = baseSchema([{ fieldId: "f1", type: "email", label: "Email" }]);
//     render(<FormPreview schema={schema} campaignType="inline" />);
//     expect(document.querySelector('input[type="email"]')).toBeInTheDocument();
//   });
//
//   it("renders textarea", () => {
//     const schema = baseSchema([{ fieldId: "f1", type: "textarea", label: "Notes" }]);
//     render(<FormPreview schema={schema} campaignType="inline" />);
//     expect(screen.getByRole("textbox")).toBeInTheDocument();
//   });
//
//   it("renders checkbox with label", () => {
//     const schema = baseSchema([{ fieldId: "f1", type: "checkbox", label: "Agree" }]);
//     render(<FormPreview schema={schema} campaignType="inline" />);
//     expect(screen.getByRole("checkbox")).toBeInTheDocument();
//     expect(screen.getByText("Agree")).toBeInTheDocument();
//   });
//
//   it("renders radio group with options", () => {
//     const schema = baseSchema([{
//       fieldId: "f1", type: "radio", label: "Size",
//       options: [{ value: "s", label: "Small" }, { value: "m", label: "Medium" }, { value: "l", label: "Large" }],
//     }]);
//     render(<FormPreview schema={schema} campaignType="inline" />);
//     expect(screen.getAllByRole("radio")).toHaveLength(3);
//   });
//
//   it("renders dropdown with options", () => {
//     const schema = baseSchema([{
//       fieldId: "f1", type: "dropdown", label: "Country",
//       options: [{ value: "us", label: "US" }, { value: "ca", label: "Canada" },
//                 { value: "uk", label: "UK" }, { value: "au", label: "AU" }],
//     }]);
//     render(<FormPreview schema={schema} campaignType="inline" />);
//     expect(screen.getByRole("combobox")).toBeInTheDocument();
//     // 4 options + 1 placeholder
//     expect(screen.getAllByRole("option")).toHaveLength(5);
//   });
//
//   it("does not render hidden field", () => {
//     const schema = baseSchema([{ fieldId: "f1", type: "hidden", label: "Token" }]);
//     const { container } = render(<FormPreview schema={schema} campaignType="inline" />);
//     // Should show empty state since only field is hidden
//     expect(screen.getByText(/no visible fields/i)).toBeInTheDocument();
//   });
//
//   it("renders submit button", () => {
//     const schema = baseSchema([{ fieldId: "f1", type: "submit", label: "Go" }]);
//     render(<FormPreview schema={schema} campaignType="inline" />);
//     expect(screen.getByText("Submit")).toBeInTheDocument();
//   });
//
//   it("applies buttonColor as inline style on submit button", () => {
//     const schema = baseSchema([{ fieldId: "f1", type: "submit", label: "Go" }]);
//     render(<FormPreview schema={{ ...schema, style: { ...baseStyle, buttonColor: "#ff0000" } }} campaignType="inline" />);
//     const btn = screen.getByText("Submit").closest("button");
//     expect(btn?.style.backgroundColor).toBe("rgb(255, 0, 0)");
//   });
//
//   it("applies fontFamily as inline style on form container", () => {
//     const schema = baseSchema([{ fieldId: "f1", type: "text", label: "Name" }]);
//     render(<FormPreview schema={{ ...schema, style: { ...baseStyle, fontFamily: "Georgia" } }} campaignType="inline" />);
//     // The wrapper div should have fontFamily set
//     const formWrapper = document.querySelector('[aria-label="Form preview"]');
//     expect(formWrapper).toBeTruthy();
//   });
//
//   it("shows empty placeholder when schema has no fields", () => {
//     const schema = baseSchema([]);
//     render(<FormPreview schema={schema} campaignType="inline" />);
//     expect(screen.getByText("Add fields to see a preview")).toBeInTheDocument();
//   });
//
//   it("hides field when visibility condition evaluates false", () => {
//     const schema = baseSchema([{
//       fieldId: "f1", type: "text", label: "Conditional",
//       visibilityCondition: { dependsOn: "trigger", operator: "equals", value: "yes" },
//     }]);
//     render(<FormPreview schema={schema} campaignType="inline" />);
//     // "trigger" is not in formValues (empty), so field is hidden → empty state
//     expect(screen.getByText(/no visible fields/i)).toBeInTheDocument();
//   });
//
//   it("sets tabindex=-1 on all inputs", () => {
//     const schema = baseSchema([
//       { fieldId: "f1", type: "text", label: "Name" },
//       { fieldId: "f2", type: "email", label: "Email" },
//     ]);
//     render(<FormPreview schema={schema} campaignType="inline" />);
//     const inputs = document.querySelectorAll("input");
//     inputs.forEach((input) => {
//       expect(input.getAttribute("tabindex")).toBe("-1");
//     });
//   });
//
//   it("popup mode renders backdrop element", () => {
//     const schema = baseSchema([{ fieldId: "f1", type: "text", label: "Name" }]);
//     render(<FormPreview schema={schema} campaignType="popup" displayMode="popup" />);
//     const backdrop = document.querySelector(".bg-black\\/40");
//     expect(backdrop).toBeInTheDocument();
//   });
//
//   it("inline mode does not render backdrop element", () => {
//     const schema = baseSchema([{ fieldId: "f1", type: "text", label: "Name" }]);
//     render(<FormPreview schema={schema} campaignType="inline" displayMode="inline" />);
//     const backdrop = document.querySelector(".bg-black\\/40");
//     expect(backdrop).not.toBeInTheDocument();
//   });
// });
//
// describe("ViewportToggle", () => {
//   it("renders three viewport buttons", () => {
//     render(<ViewportToggle value="desktop" onChange={() => {}} />);
//     expect(screen.getByText("Desktop")).toBeInTheDocument();
//     expect(screen.getByText("Tablet")).toBeInTheDocument();
//     expect(screen.getByText("Mobile")).toBeInTheDocument();
//   });
//
//   it("marks the active viewport button as checked", () => {
//     render(<ViewportToggle value="tablet" onChange={() => {}} />);
//     const tabletBtn = screen.getByText("Tablet").closest("button");
//     expect(tabletBtn?.getAttribute("aria-checked")).toBe("true");
//     const desktopBtn = screen.getByText("Desktop").closest("button");
//     expect(desktopBtn?.getAttribute("aria-checked")).toBe("false");
//   });
//
//   it("calls onChange with correct viewport key when clicked", async () => {
//     const { default: userEvent } = await import("@testing-library/user-event");
//     const user = userEvent.setup();
//     const onChange = vi.fn();
//     render(<ViewportToggle value="desktop" onChange={onChange} />);
//     await user.click(screen.getByText("Mobile"));
//     expect(onChange).toHaveBeenCalledWith("mobile");
//   });
//
//   it("has correct ARIA roles for accessibility", () => {
//     render(<ViewportToggle value="desktop" onChange={() => {}} />);
//     expect(screen.getByRole("radiogroup")).toBeInTheDocument();
//     const radios = screen.getAllByRole("radio");
//     expect(radios).toHaveLength(3);
//   });
// });
