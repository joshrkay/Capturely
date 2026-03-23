"use client";

interface FormStyle {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderRadius: string;
  fontFamily: string;
  padding?: string;
  buttonBorderRadius?: string;
  buttonHoverColor?: string;
  boxShadow?: string;
}

export interface StyleEditorProps {
  style: FormStyle;
  submitLabel: string;
  onChange: (style: FormStyle) => void;
  onSubmitLabelChange: (label: string) => void;
}

const inputClasses =
  "w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelClasses = "text-xs font-medium text-zinc-600 dark:text-zinc-400";
const headingClasses = "text-sm font-semibold text-zinc-900 dark:text-zinc-100";

function ColorRow({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded border border-zinc-300 dark:border-zinc-700">
        <input
          id={id}
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="-m-1 h-10 w-10 cursor-pointer"
        />
      </div>
      <div className="flex-1">
        <label htmlFor={id} className={labelClasses}>
          {label}
        </label>
        <span className="ml-2 text-xs text-zinc-500">{value || "—"}</span>
      </div>
    </div>
  );
}

export function StyleEditor({ style, submitLabel, onChange, onSubmitLabelChange }: StyleEditorProps) {
  const update = (patch: Partial<FormStyle>) => onChange({ ...style, ...patch });

  return (
    <div className="space-y-6">
      {/* Colors */}
      <section className="space-y-3">
        <h3 className={headingClasses}>Colors</h3>
        <ColorRow
          id="style-backgroundColor"
          label="Background"
          value={style.backgroundColor ?? ""}
          onChange={(v) => update({ backgroundColor: v })}
        />
        <ColorRow
          id="style-textColor"
          label="Text"
          value={style.textColor ?? ""}
          onChange={(v) => update({ textColor: v })}
        />
      </section>

      {/* Button */}
      <section className="space-y-3">
        <h3 className={headingClasses}>Button</h3>
        <ColorRow
          id="style-buttonColor"
          label="Button Color"
          value={style.buttonColor ?? ""}
          onChange={(v) => update({ buttonColor: v })}
        />
        <ColorRow
          id="style-buttonTextColor"
          label="Button Text"
          value={style.buttonTextColor ?? ""}
          onChange={(v) => update({ buttonTextColor: v })}
        />
        <ColorRow
          id="style-buttonHoverColor"
          label="Button Hover"
          value={style.buttonHoverColor ?? ""}
          onChange={(v) => update({ buttonHoverColor: v })}
        />
        <div>
          <label htmlFor="style-buttonBorderRadius" className={`mb-1 block ${labelClasses}`}>
            Button Border Radius
          </label>
          <input
            id="style-buttonBorderRadius"
            type="text"
            value={style.buttonBorderRadius ?? ""}
            placeholder="e.g. 6px"
            onChange={(e) => update({ buttonBorderRadius: e.target.value })}
            className={inputClasses}
          />
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-3">
        <h3 className={headingClasses}>Typography</h3>
        <div>
          <label htmlFor="style-fontFamily" className={`mb-1 block ${labelClasses}`}>
            Font Family
          </label>
          <select
            id="style-fontFamily"
            value={style.fontFamily ?? "Inter, sans-serif"}
            onChange={(e) => update({ fontFamily: e.target.value })}
            className={inputClasses}
          >
            <option value="Inter, sans-serif">Inter</option>
            <option value="system-ui, sans-serif">System UI</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="ui-monospace, monospace">Monospace</option>
          </select>
        </div>
      </section>

      {/* Layout */}
      <section className="space-y-3">
        <h3 className={headingClasses}>Layout</h3>
        <div>
          <label htmlFor="style-borderRadius" className={`mb-1 block ${labelClasses}`}>
            Border Radius
          </label>
          <input
            id="style-borderRadius"
            type="text"
            value={style.borderRadius ?? ""}
            placeholder="e.g. 8px"
            onChange={(e) => update({ borderRadius: e.target.value })}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="style-padding" className={`mb-1 block ${labelClasses}`}>
            Padding
          </label>
          <input
            id="style-padding"
            type="text"
            value={style.padding ?? ""}
            placeholder="e.g. 24px or 16px 24px"
            onChange={(e) => update({ padding: e.target.value })}
            className={inputClasses}
          />
        </div>
      </section>

      {/* Effects */}
      <section className="space-y-3">
        <h3 className={headingClasses}>Effects</h3>
        <div>
          <label htmlFor="style-boxShadow" className={`mb-1 block ${labelClasses}`}>
            Box Shadow
          </label>
          <select
            id="style-boxShadow"
            value={style.boxShadow ?? "none"}
            onChange={(e) => update({ boxShadow: e.target.value })}
            className={inputClasses}
          >
            <option value="none">None</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra Large</option>
          </select>
        </div>
      </section>

      {/* Submit Button Label */}
      <section className="space-y-3">
        <h3 className={headingClasses}>Submit Button Label</h3>
        <div>
          <label htmlFor="style-submitLabel" className={`mb-1 block ${labelClasses}`}>
            Button Text
          </label>
          <input
            id="style-submitLabel"
            type="text"
            value={submitLabel}
            onChange={(e) => onSubmitLabelChange(e.target.value)}
            className={inputClasses}
          />
        </div>
      </section>
    </div>
  );
}
