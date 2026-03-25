"use client";

import { useEffect, useRef, useState } from "react";
import { TrafficSlider } from "./TrafficSlider";

export interface Variant {
  id: string;
  campaignId: string;
  name: string;
  isControl: boolean;
  trafficPercentage: number;
  schemaJson: string;
  schemaVersion: number;
  generatedBy: string;
}

interface VariantCardProps {
  variant: Variant;
  isActive: boolean;
  pendingTraffic: number | undefined;
  isEditingName: boolean;
  isConfirmingDelete: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onCommitRename: (name: string) => void;
  onCancelRename: () => void;
  onTrafficChange: (variantId: string, value: number) => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function VariantCard({
  variant,
  isActive,
  pendingTraffic,
  isEditingName,
  isConfirmingDelete,
  canEdit,
  onSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onTrafficChange,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: VariantCardProps) {
  const [draftName, setDraftName] = useState(variant.name);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Focus name input when entering edit mode
  useEffect(() => {
    if (isEditingName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftName(variant.name);
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName, variant.name]);

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (draftName.trim().length > 0) {
        onCommitRename(draftName.trim());
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancelRename();
      setTimeout(() => cardRef.current?.focus(), 0);
    }
  };

  const trafficValue = pendingTraffic ?? variant.trafficPercentage;

  return (
    <div
      ref={cardRef}
      role="option"
      aria-selected={isActive}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`rounded border px-3 py-2 bg-white dark:bg-zinc-900 cursor-pointer transition-shadow ${
        isActive
          ? "border-blue-500 ring-2 ring-blue-500 dark:border-blue-400 dark:ring-blue-400"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
    >
      {/* Name row */}
      <div className="flex items-center gap-2 mb-1.5">
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={handleNameKeyDown}
            onBlur={() => {
              if (draftName.trim().length > 0) {
                onCommitRename(draftName.trim());
              } else {
                onCancelRename();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (canEdit) onStartRename();
            }}
            className="flex-1 text-left text-sm text-zinc-800 dark:text-zinc-200 hover:text-zinc-600 dark:hover:text-zinc-400 truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            title={canEdit ? "Click to rename" : undefined}
          >
            {variant.name}
          </button>
        )}

        {variant.isControl && (
          <span className="shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-1.5 py-0.5 rounded">
            Control
          </span>
        )}
      </div>

      {/* Traffic slider */}
      <div onClick={(e) => e.stopPropagation()}>
        <TrafficSlider
          variantId={variant.id}
          variantName={variant.name}
          value={trafficValue}
          onChange={onTrafficChange}
          disabled={!canEdit}
        />
      </div>

      {/* Delete / confirm row */}
      {canEdit && (
        <div className="mt-1.5 flex justify-end" onClick={(e) => e.stopPropagation()}>
          {isConfirmingDelete ? (
            <span className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              Delete this variant?{" "}
              <button
                onClick={onDeleteConfirm}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                Yes
              </button>
              {" / "}
              <button
                onClick={onDeleteCancel}
                className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                No
              </button>
            </span>
          ) : variant.isControl ? (
            <button
              aria-disabled="true"
              title="Control variant cannot be deleted"
              className="text-xs text-red-500 dark:text-red-400 opacity-30 cursor-not-allowed"
              onClick={(e) => e.preventDefault()}
            >
              Delete
            </button>
          ) : (
            <button
              onClick={onDeleteRequest}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
