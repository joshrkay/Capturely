import type { FormSchema } from "@capturely/shared-forms";
import { BOX_SHADOW_MAP } from "@capturely/shared-forms";

/** Create the popup overlay and dialog shell. Returns the container element and a close function. */
export function createPopup(
  schema: FormSchema,
  onClose: () => void
): { container: HTMLElement; formContainer: HTMLElement; destroy: () => void } {
  const style = schema.style ?? {};

  // Overlay
  const overlay = document.createElement("div");
  overlay.setAttribute("role", "presentation");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "999999",
  });

  // Dialog
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("tabindex", "-1");
  Object.assign(dialog.style, {
    backgroundColor: style.backgroundColor ?? "#ffffff",
    color: style.textColor ?? "#1a1a1a",
    borderRadius: style.borderRadius ?? "8px",
    padding: style.padding ?? "24px",
    maxWidth: "480px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
    fontFamily: style.fontFamily ?? "system-ui, sans-serif",
    boxShadow: style.boxShadow
      ? (BOX_SHADOW_MAP[style.boxShadow] ?? "none")
      : "0 25px 50px -12px rgba(0,0,0,0.25)",
  });

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "\u00d7";
  closeBtn.setAttribute("aria-label", "Close");
  Object.assign(closeBtn.style, {
    position: "absolute",
    top: "8px",
    right: "12px",
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: style.textColor ?? "#666",
    lineHeight: "1",
  });

  // Form container
  const formContainer = document.createElement("div");

  dialog.appendChild(closeBtn);
  dialog.appendChild(formContainer);
  overlay.appendChild(dialog);

  // Close handlers
  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", escHandler);
    onClose();
  };

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  const escHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", escHandler);

  document.body.appendChild(overlay);
  dialog.focus();

  return { container: overlay, formContainer, destroy: close };
}
