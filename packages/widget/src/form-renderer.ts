import type { FormField, FormSchema, FormStyle } from "@capturely/shared-forms";

export interface FormRendererOptions {
  schema: FormSchema;
  container: HTMLElement;
  onSubmit: (payload: Record<string, string>) => void;
}

/**
 * Render a form into the given container based on the form schema.
 * Returns a cleanup function.
 */
export function renderForm({ schema, container, onSubmit }: FormRendererOptions): () => void {
  const style = schema.style ?? {};
  const formValues: Record<string, string> = {};

  // ── Multi-step state ───────────────────────────────────────────────────────
  const isMultiStep = !!(schema.steps && schema.steps.length > 1);
  let currentStep = 0;
  const totalSteps = isMultiStep ? schema.steps!.length : 1;

  // Build a map of fieldId → step index for O(1) lookups
  const fieldStepMap: Map<string, number> = new Map();
  if (isMultiStep) {
    for (let si = 0; si < schema.steps!.length; si++) {
      for (const fid of schema.steps![si].fieldIds) {
        fieldStepMap.set(fid, si);
      }
    }
  }

  // ── Progress bar ───────────────────────────────────────────────────────────
  let progressBar: HTMLElement | null = null;

  function createProgressBar(): HTMLElement {
    const pb = document.createElement("div");
    pb.setAttribute("data-capturely-progress", "");
    Object.assign(pb.style, { marginBottom: "16px" });
    updateProgressBar(pb);
    return pb;
  }

  function updateProgressBar(pb: HTMLElement) {
    pb.innerHTML = "";
    const barStyle = schema.progressBarStyle ?? "dots";
    if (barStyle === "none") return;

    if (barStyle === "dots") {
      Object.assign(pb.style, { display: "flex", justifyContent: "center", gap: "8px" });
      for (let i = 0; i < totalSteps; i++) {
        const dot = document.createElement("div");
        Object.assign(dot.style, {
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: i === currentStep ? "#4f46e5" : "#d4d4d8",
          transition: "background-color 0.2s",
        });
        pb.appendChild(dot);
      }
      return;
    }

    if (barStyle === "bar") {
      Object.assign(pb.style, { display: "block" });
      const track = document.createElement("div");
      Object.assign(track.style, {
        width: "100%",
        height: "4px",
        borderRadius: "9999px",
        backgroundColor: "#e4e4e7",
        overflow: "hidden",
      });
      const fill = document.createElement("div");
      const pct = Math.round(((currentStep + 1) / totalSteps) * 100);
      Object.assign(fill.style, {
        height: "100%",
        borderRadius: "9999px",
        backgroundColor: "#4f46e5",
        width: `${pct}%`,
        transition: "width 0.3s",
      });
      track.appendChild(fill);
      pb.appendChild(track);
      return;
    }

    if (barStyle === "steps") {
      Object.assign(pb.style, { display: "flex", justifyContent: "center", alignItems: "center", gap: "4px" });
      for (let i = 0; i < totalSteps; i++) {
        const circle = document.createElement("div");
        Object.assign(circle.style, {
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: i === currentStep ? "#4f46e5" : i < currentStep ? "#c7d2fe" : "#e4e4e7",
          color: i === currentStep ? "#ffffff" : i < currentStep ? "#4338ca" : "#71717a",
          transition: "background-color 0.2s",
        });
        circle.textContent = String(i + 1);
        pb.appendChild(circle);
        if (i < totalSteps - 1) {
          const line = document.createElement("div");
          Object.assign(line.style, { width: "16px", height: "1px", backgroundColor: "#d4d4d8" });
          pb.appendChild(line);
        }
      }
    }
  }

  // ── Build form ─────────────────────────────────────────────────────────────
  const form = document.createElement("form");
  form.setAttribute("novalidate", "");
  Object.assign(form.style, {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  });

  const fieldElements: Map<string, HTMLElement> = new Map();
  let submitWrapper: HTMLElement | null = null;

  for (const field of schema.fields) {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-field-id", field.fieldId);

    if (field.type === "hidden") {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = field.fieldId;
      input.value = field.defaultValue ?? "";
      formValues[field.fieldId] = input.value;
      wrapper.appendChild(input);
      form.appendChild(wrapper);
      fieldElements.set(field.fieldId, wrapper);
      continue;
    }

    if (field.type === "submit") {
      submitWrapper = wrapper;
      if (!isMultiStep) {
        const btn = document.createElement("button");
        btn.type = "submit";
        btn.textContent = schema.submitLabel ?? field.label ?? "Submit";
        const buttonBg = style.buttonColor ?? "#1a1a1a";
        Object.assign(btn.style, {
          backgroundColor: buttonBg,
          color: style.buttonTextColor ?? "#ffffff",
          border: "none",
          borderRadius: style.buttonBorderRadius ?? style.borderRadius ?? "6px",
          padding: "10px 20px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          marginTop: "4px",
          width: "100%",
        });
        if (style.buttonHoverColor) {
          btn.addEventListener("mouseenter", () => {
            btn.style.backgroundColor = style.buttonHoverColor!;
          });
          btn.addEventListener("mouseleave", () => {
            btn.style.backgroundColor = buttonBg;
          });
        }
        wrapper.appendChild(btn);
      }
      form.appendChild(wrapper);
      fieldElements.set(field.fieldId, wrapper);
      continue;
    }

    // Label
    if (field.label) {
      const label = document.createElement("label");
      label.textContent = field.label;
      label.setAttribute("for", `capturely-${field.fieldId}`);
      Object.assign(label.style, {
        fontSize: "13px",
        fontWeight: "500",
        display: "block",
        marginBottom: "4px",
      });
      if (field.required) {
        const star = document.createElement("span");
        star.textContent = " *";
        star.style.color = "#ef4444";
        label.appendChild(star);
      }
      wrapper.appendChild(label);
    }

    // Input element
    const input = createInput(field, style);
    input.id = `capturely-${field.fieldId}`;
    input.addEventListener("input", () => {
      formValues[field.fieldId] = (input as HTMLInputElement).value;
      updateVisibility();
    });
    input.addEventListener("change", () => {
      formValues[field.fieldId] = (input as HTMLInputElement).value;
      updateVisibility();
    });

    wrapper.appendChild(input);
    form.appendChild(wrapper);
    fieldElements.set(field.fieldId, wrapper);
  }

  // ── Step navigation injection ──────────────────────────────────────────────
  let stepErrorEl: HTMLElement | null = null;

  function renderNavigation() {
    if (!submitWrapper || !isMultiStep) return;
    submitWrapper.innerHTML = "";

    const buttonRadius = style.buttonBorderRadius ?? style.borderRadius ?? "6px";
    const buttonBg = style.buttonColor ?? "#1a1a1a";
    const buttonText = style.buttonTextColor ?? "#ffffff";

    const navRow = document.createElement("div");
    Object.assign(navRow.style, { display: "flex", gap: "8px", marginTop: "4px" });

    if (currentStep > 0) {
      const backBtn = document.createElement("button");
      backBtn.type = "button";
      backBtn.textContent = "Back";
      Object.assign(backBtn.style, {
        flex: "1",
        padding: "10px 20px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        border: "1px solid #d4d4d8",
        borderRadius: buttonRadius,
        backgroundColor: "transparent",
        color: "#3f3f46",
      });
      backBtn.addEventListener("click", goBack);
      navRow.appendChild(backBtn);
    }

    const primaryBtn = document.createElement("button");
    primaryBtn.type = "button";
    const isFinal = currentStep === totalSteps - 1;
    primaryBtn.textContent = isFinal
      ? (schema.submitLabel ?? "Submit")
      : "Next";
    Object.assign(primaryBtn.style, {
      flex: "1",
      backgroundColor: buttonBg,
      color: buttonText,
      border: "none",
      borderRadius: buttonRadius,
      padding: "10px 20px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    });
    if (style.buttonHoverColor) {
      primaryBtn.addEventListener("mouseenter", () => {
        primaryBtn.style.backgroundColor = style.buttonHoverColor!;
      });
      primaryBtn.addEventListener("mouseleave", () => {
        primaryBtn.style.backgroundColor = buttonBg;
      });
    }
    primaryBtn.addEventListener("click", isFinal ? handleFinalSubmit : goNext);
    navRow.appendChild(primaryBtn);

    submitWrapper.appendChild(navRow);

    // Error message element
    stepErrorEl = document.createElement("div");
    Object.assign(stepErrorEl.style, {
      display: "none",
      color: "#ef4444",
      fontSize: "12px",
      marginTop: "4px",
    });
    submitWrapper.appendChild(stepErrorEl);
  }

  // ── Step visibility ────────────────────────────────────────────────────────

  function applyStepVisibility() {
    for (const field of schema.fields) {
      if (field.type === "hidden") continue;
      const el = fieldElements.get(field.fieldId);
      if (!el) continue;
      if (field.type === "submit") continue; // handled by renderNavigation

      const stepIdx = fieldStepMap.get(field.fieldId);
      if (stepIdx === undefined) {
        // Unassigned field — hide it
        el.style.display = "none";
      } else {
        el.style.display = stepIdx === currentStep ? "" : "none";
      }
    }
  }

  // ── Per-step validation ────────────────────────────────────────────────────

  function validateCurrentStep(): boolean {
    const currentFieldIds = schema.steps![currentStep].fieldIds;
    for (const fid of currentFieldIds) {
      const field = schema.fields.find((f) => f.fieldId === fid);
      if (!field || !field.required) continue;
      const el = fieldElements.get(fid);
      if (!el || el.style.display === "none") continue;
      const value = formValues[fid] ?? "";
      if (value.trim().length === 0) return false;
    }
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) {
      if (stepErrorEl) {
        stepErrorEl.textContent = "Please fill in all required fields before continuing.";
        stepErrorEl.style.display = "block";
      }
      return;
    }
    if (stepErrorEl) stepErrorEl.style.display = "none";
    currentStep = Math.min(totalSteps - 1, currentStep + 1);
    applyStepVisibility();
    if (progressBar) updateProgressBar(progressBar);
    renderNavigation();
  }

  function goBack() {
    currentStep = Math.max(0, currentStep - 1);
    if (stepErrorEl) stepErrorEl.style.display = "none";
    applyStepVisibility();
    if (progressBar) updateProgressBar(progressBar);
    renderNavigation();
  }

  function handleFinalSubmit() {
    if (!validateCurrentStep()) {
      if (stepErrorEl) {
        stepErrorEl.textContent = "Please fill in all required fields before submitting.";
        stepErrorEl.style.display = "block";
      }
      return;
    }
    submitForm();
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function submitForm() {
    const payload: Record<string, string> = {};
    for (const field of schema.fields) {
      if (field.type === "submit") continue;
      const el = fieldElements.get(field.fieldId);
      // For multi-step, collect all fields that are not hidden by visibility condition
      if (field.type === "hidden") {
        payload[field.fieldId] = formValues[field.fieldId] ?? "";
        continue;
      }
      if (el && el.style.display !== "none") {
        payload[field.fieldId] = formValues[field.fieldId] ?? "";
      }
    }
    onSubmit(payload);
  }

  // Single-step submit handler (non-multi-step path)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (isMultiStep) return; // handled by button click
    const payload: Record<string, string> = {};
    for (const field of schema.fields) {
      if (field.type === "submit") continue;
      const el = fieldElements.get(field.fieldId);
      if (el && el.style.display !== "none") {
        payload[field.fieldId] = formValues[field.fieldId] ?? "";
      }
    }
    onSubmit(payload);
  });

  // ── Visibility management (conditional logic) ──────────────────────────────
  function updateVisibility() {
    for (const field of schema.fields) {
      const el = fieldElements.get(field.fieldId);
      if (!el) continue;

      if (field.visibilityCondition) {
        const depValue = formValues[field.visibilityCondition.dependsOn] ?? "";
        let visible = true;
        switch (field.visibilityCondition.operator) {
          case "equals":
            visible = depValue === (field.visibilityCondition.value ?? "");
            break;
          case "not_equals":
            visible = depValue !== (field.visibilityCondition.value ?? "");
            break;
          case "contains":
            visible = depValue.includes(field.visibilityCondition.value ?? "");
            break;
          case "not_empty":
            visible = depValue.trim().length > 0;
            break;
        }
        // For multi-step: only show if also in current step
        if (isMultiStep) {
          const stepIdx = fieldStepMap.get(field.fieldId);
          el.style.display = visible && stepIdx === currentStep ? "" : "none";
        } else {
          el.style.display = visible ? "" : "none";
        }
      }
    }
  }

  // ── Mount ──────────────────────────────────────────────────────────────────

  if (isMultiStep) {
    progressBar = createProgressBar();
    container.appendChild(progressBar);
    applyStepVisibility();
    renderNavigation();
  }

  container.appendChild(form);
  updateVisibility();

  return () => {
    if (progressBar) progressBar.remove();
    form.remove();
  };
}

function createInput(field: FormField, style: FormStyle): HTMLElement {
  const baseStyle = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #d4d4d8",
    borderRadius: style.borderRadius ?? "6px",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  switch (field.type) {
    case "textarea": {
      const el = document.createElement("textarea");
      el.name = field.fieldId;
      el.placeholder = field.placeholder ?? "";
      el.required = field.required ?? false;
      el.rows = 3;
      Object.assign(el.style, baseStyle);
      return el;
    }

    case "dropdown": {
      const el = document.createElement("select");
      el.name = field.fieldId;
      el.required = field.required ?? false;
      Object.assign(el.style, baseStyle);

      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = field.placeholder ?? "Select...";
      el.appendChild(defaultOpt);

      for (const opt of field.options ?? []) {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        el.appendChild(option);
      }
      return el;
    }

    case "radio": {
      const container = document.createElement("div");
      Object.assign(container.style, { display: "flex", flexDirection: "column", gap: "6px" });

      for (const opt of field.options ?? []) {
        const label = document.createElement("label");
        Object.assign(label.style, { display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", cursor: "pointer" });

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = field.fieldId;
        radio.value = opt.value;
        radio.required = field.required ?? false;

        label.appendChild(radio);
        label.appendChild(document.createTextNode(opt.label));
        container.appendChild(label);
      }
      return container;
    }

    case "checkbox": {
      const label = document.createElement("label");
      Object.assign(label.style, { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" });

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.name = field.fieldId;
      cb.required = field.required ?? false;

      label.appendChild(cb);
      label.appendChild(document.createTextNode(field.label));
      return label;
    }

    default: {
      const el = document.createElement("input");
      el.type = field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text";
      el.name = field.fieldId;
      el.placeholder = field.placeholder ?? "";
      el.required = field.required ?? false;
      Object.assign(el.style, baseStyle);
      return el;
    }
  }
}
