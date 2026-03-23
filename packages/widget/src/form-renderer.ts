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

  const form = document.createElement("form");
  form.setAttribute("novalidate", "");
  Object.assign(form.style, {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  });

  const fieldElements: Map<string, HTMLElement> = new Map();

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

  // Visibility management
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
        el.style.display = visible ? "" : "none";
      }
    }
  }

  // Submit handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Build payload from visible fields only
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

  container.appendChild(form);
  updateVisibility();

  return () => {
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
