"use client";

import { useState, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormField {
  fieldId: string;
  type: string;
  label: string;
}

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

interface FormStep {
  label: string;
  fieldIds: string[];
}

interface FormSchema {
  fields: FormField[];
  style: FormStyle;
  submitLabel: string;
  steps?: FormStep[];
  progressBarStyle?: "dots" | "bar" | "steps" | "none";
}

// ─── Field Chip (Draggable) ───────────────────────────────────────────────────

function FieldChip({
  field,
  containerId,
}: {
  field: FormField;
  containerId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${containerId}::${field.fieldId}`,
      data: { fieldId: field.fieldId, sourceContainer: containerId },
    });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs cursor-grab select-none ${
        isDragging
          ? "opacity-40"
          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
      }`}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="text-zinc-400"
      >
        <circle cx="5" cy="4" r="1.5" />
        <circle cx="11" cy="4" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="11" cy="12" r="1.5" />
      </svg>
      <span className="rounded bg-zinc-100 px-1 font-mono text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
        {field.type}
      </span>
      <span className="truncate text-zinc-700 dark:text-zinc-300">
        {field.label}
      </span>
    </div>
  );
}

// ─── Step Drop Zone ───────────────────────────────────────────────────────────

function StepDropZone({
  stepIndex,
  stepId,
  fields,
  isOver,
}: {
  stepIndex: number;
  stepId: string;
  fields: FormField[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: stepId });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[48px] rounded border-2 border-dashed p-2 transition-colors ${
        isOver
          ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/40"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50"
      }`}
    >
      {fields.length === 0 ? (
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
          Drop fields here
        </p>
      ) : (
        <div className="space-y-1">
          {fields.map((f) => (
            <FieldChip key={f.fieldId} field={f} containerId={`step-${stepIndex}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sortable Step Row ────────────────────────────────────────────────────────

function SortableStep({
  step,
  stepIndex,
  stepId,
  allFields,
  overContainer,
  onLabelChange,
  onRemove,
}: {
  step: FormStep;
  stepIndex: number;
  stepId: string;
  allFields: FormField[];
  overContainer: string | null;
  onLabelChange: (label: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: stepId });
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const stepFields = step.fieldIds
    .map((fid) => allFields.find((f) => f.fieldId === fid))
    .filter(Boolean) as FormField[];

  const isOver = overContainer === stepId;

  return (
    <div ref={setNodeRef} style={sortableStyle} className="space-y-1.5">
      {/* Step header */}
      <div className="flex items-center gap-1.5">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-zinc-400 hover:text-zinc-600"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1.5" />
            <circle cx="11" cy="4" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="11" cy="12" r="1.5" />
          </svg>
        </div>
        <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
          {stepIndex + 1}
        </span>
        <input
          type="text"
          value={step.label}
          onChange={(e) => onLabelChange(e.target.value)}
          className="flex-1 rounded border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-zinc-400 hover:text-red-500"
          title="Remove step"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Drop zone */}
      <StepDropZone
        stepIndex={stepIndex}
        stepId={stepId}
        fields={stepFields}
        isOver={isOver}
      />
    </div>
  );
}

// ─── Unassigned Pool ──────────────────────────────────────────────────────────

function UnassignedPool({
  fields,
  isOver,
}: {
  fields: FormField[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: "unassigned" });

  if (fields.length === 0 && !isOver) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Unassigned
      </p>
      <div
        ref={setNodeRef}
        className={`min-h-[40px] rounded border-2 border-dashed p-2 transition-colors ${
          isOver
            ? "border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/30"
            : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50"
        }`}
      >
        {fields.length === 0 ? (
          <p className="text-center text-xs text-zinc-400">Drop to unassign</p>
        ) : (
          <div className="space-y-1">
            {fields.map((f) => (
              <FieldChip key={f.fieldId} field={f} containerId="unassigned" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Drag overlay chip ────────────────────────────────────────────────────────

function DragOverlayChip({ field }: { field: FormField | null }) {
  if (!field) return null;
  return (
    <div className="flex items-center gap-1.5 rounded border border-indigo-300 bg-white px-2 py-1 text-xs shadow-lg dark:border-indigo-600 dark:bg-zinc-800">
      <span className="rounded bg-zinc-100 px-1 font-mono text-zinc-500 dark:bg-zinc-700">
        {field.type}
      </span>
      <span className="text-zinc-700 dark:text-zinc-300">{field.label}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MultiStepEditor({
  schema,
  onSchemaChange,
}: {
  schema: FormSchema;
  onSchemaChange: (updated: FormSchema) => void;
}) {
  const [overContainer, setOverContainer] = useState<string | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const steps = schema.steps ?? [];
  const progressBarStyle = schema.progressBarStyle ?? "dots";

  // Build step IDs for SortableContext
  const stepIds = steps.map((_, i) => `step-${i}`);

  // Compute which fields are unassigned
  const assignedFieldIds = new Set(steps.flatMap((s) => s.fieldIds));
  const unassignedFields = schema.fields.filter(
    (f) => f.type !== "submit" && f.type !== "hidden" && !assignedFieldIds.has(f.fieldId)
  );

  // Active dragging field
  const activeField =
    activeFieldId ? schema.fields.find((f) => f.fieldId === activeFieldId) ?? null : null;

  // ── Initialize multi-step ──────────────────────────────────────────────────

  const initSteps = () => {
    const nonSpecial = schema.fields.filter(
      (f) => f.type !== "submit" && f.type !== "hidden"
    );
    const step1: FormStep = { label: "Step 1", fieldIds: nonSpecial.map((f) => f.fieldId) };
    const step2: FormStep = { label: "Step 2", fieldIds: [] };
    onSchemaChange({ ...schema, steps: [step1, step2], progressBarStyle: "dots" });
  };

  const addStep = () => {
    const newStep: FormStep = { label: `Step ${steps.length + 1}`, fieldIds: [] };
    onSchemaChange({ ...schema, steps: [...steps, newStep] });
  };

  const removeStep = (index: number) => {
    const orphaned = steps[index].fieldIds;
    const newSteps = steps.filter((_, i) => i !== index).map((s) => ({ ...s }));
    // Merge orphaned fields into previous step, or first remaining step
    const targetIndex = Math.max(0, index - 1);
    if (newSteps.length > 0) {
      newSteps[targetIndex] = {
        ...newSteps[targetIndex],
        fieldIds: [...newSteps[targetIndex].fieldIds, ...orphaned],
      };
    }
    onSchemaChange({
      ...schema,
      steps: newSteps.length >= 1 ? newSteps : undefined,
      progressBarStyle: newSteps.length >= 1 ? schema.progressBarStyle : undefined,
    });
  };

  const updateStepLabel = (index: number, label: string) => {
    const newSteps = steps.map((s, i) => (i === index ? { ...s, label } : s));
    onSchemaChange({ ...schema, steps: newSteps });
  };

  // ── Step reorder (SortableContext drag end) ────────────────────────────────

  const handleStepDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stepIds.indexOf(active.id as string);
    const newIndex = stepIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    onSchemaChange({ ...schema, steps: arrayMove(steps, oldIndex, newIndex) });
  };

  // ── Field assignment drag ──────────────────────────────────────────────────

  const handleFieldDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { fieldId: string };
    setActiveFieldId(data.fieldId);
  };

  const handleFieldDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverContainer(over ? (over.id as string) : null);
  };

  const handleFieldDragEnd = (event: DragEndEvent) => {
    setOverContainer(null);
    setActiveFieldId(null);

    const { active, over } = event;
    if (!over) return;

    const data = active.data.current as { fieldId: string; sourceContainer: string };
    const { fieldId, sourceContainer } = data;
    const destContainer = over.id as string;

    if (sourceContainer === destContainer) return;

    const newSteps = steps.map((s) => ({ ...s, fieldIds: [...s.fieldIds] }));

    // Remove from source
    if (sourceContainer === "unassigned") {
      // nothing to remove from steps
    } else {
      const srcIdx = parseInt(sourceContainer.replace("step-", ""), 10);
      newSteps[srcIdx].fieldIds = newSteps[srcIdx].fieldIds.filter((id) => id !== fieldId);
    }

    // Add to destination
    if (destContainer !== "unassigned") {
      const dstIdx = parseInt(destContainer.replace("step-", ""), 10);
      if (!newSteps[dstIdx].fieldIds.includes(fieldId)) {
        newSteps[dstIdx].fieldIds.push(fieldId);
      }
    }

    onSchemaChange({ ...schema, steps: newSteps });
  };

  // ── If no steps configured yet ─────────────────────────────────────────────

  if (steps.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Multi-Step
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Split your form into steps to show fields progressively.
        </p>
        <button
          type="button"
          onClick={initSteps}
          className="w-full rounded border border-indigo-300 bg-indigo-50 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
        >
          Enable Multi-Step
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Multi-Step ({steps.length} steps)
        </h3>
        <button
          type="button"
          onClick={() =>
            onSchemaChange({ ...schema, steps: undefined, progressBarStyle: undefined })
          }
          className="text-xs text-zinc-400 hover:text-red-500"
          title="Disable multi-step"
        >
          Disable
        </button>
      </div>

      {/* Progress bar style */}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Progress indicator
        </label>
        <select
          value={progressBarStyle}
          onChange={(e) =>
            onSchemaChange({
              ...schema,
              progressBarStyle: e.target.value as FormSchema["progressBarStyle"],
            })
          }
          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="dots">Dots</option>
          <option value="bar">Progress Bar</option>
          <option value="steps">Step Numbers</option>
          <option value="none">None</option>
        </select>
      </div>

      {/* Step list — sortable */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleStepDragEnd}
      >
        <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
          {/* Field assignment DnD wraps the step drop zones */}
          <DndContext
            sensors={sensors}
            onDragStart={handleFieldDragStart}
            onDragOver={handleFieldDragOver}
            onDragEnd={handleFieldDragEnd}
          >
            <div className="space-y-3">
              {steps.map((step, i) => (
                <SortableStep
                  key={`step-${i}`}
                  step={step}
                  stepIndex={i}
                  stepId={`step-${i}`}
                  allFields={schema.fields}
                  overContainer={overContainer}
                  onLabelChange={(label) => updateStepLabel(i, label)}
                  onRemove={() => removeStep(i)}
                />
              ))}

              <UnassignedPool
                fields={unassignedFields}
                isOver={overContainer === "unassigned"}
              />
            </div>

            <DragOverlay>
              <DragOverlayChip field={activeField} />
            </DragOverlay>
          </DndContext>
        </SortableContext>
      </DndContext>

      {/* Add step */}
      <button
        type="button"
        onClick={addStep}
        className="w-full rounded border border-dashed border-zinc-300 py-1.5 text-xs text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:hover:border-indigo-500"
      >
        + Add Step
      </button>
    </div>
  );
}
