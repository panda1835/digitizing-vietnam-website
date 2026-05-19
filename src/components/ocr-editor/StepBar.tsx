"use client";

/**
 * Editor step indicator — DVN-styled port of text-search's
 * `.nom-ocr-stages` numbered stage bar. Horizontal: a numbered circle +
 * label per step with pending / active / done states and connectors.
 *
 *   pending — grey
 *   active  — primary-blue label + underline + filled blue circle
 *   done    — branding-brown label + filled brown circle
 *
 * DVN's H/N-excluded flow has three steps; the Quốc Ngữ panel lives
 * inside Characters (Step 3) rather than as its own stage.
 */

export type StepState = "pending" | "active" | "done";

export interface StepBarItem {
  label: string;
  state: StepState;
}

export default function StepBar({ steps }: { steps: StepBarItem[] }) {
  return (
    <div className="flex items-center justify-center flex-shrink-0 mb-3 font-halyard select-none">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div
            className={[
              "flex items-center gap-2 px-3 py-1.5 text-sm border-b-2",
              s.state === "active"
                ? "text-primary-blue border-primary-blue font-semibold"
                : s.state === "done"
                ? "text-branding-brown border-transparent"
                : "text-gray-400 border-transparent",
            ].join(" ")}
          >
            <span
              className={[
                "inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold",
                s.state === "active"
                  ? "bg-primary-blue text-white"
                  : s.state === "done"
                  ? "bg-branding-brown text-white"
                  : "bg-gray-200 text-gray-500",
              ].join(" ")}
            >
              {i + 1}
            </span>
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <span className="w-8 h-px bg-gray-200" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}
