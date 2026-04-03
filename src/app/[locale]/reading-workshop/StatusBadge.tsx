"use client";

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-branding-black/10 text-branding-black/60",
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  complete: "bg-green-100 text-green-700",
  corrected: "bg-purple-100 text-purple-700",
  error: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full uppercase tracking-wide ${
        STATUS_STYLES[status] ?? STATUS_STYLES.queued
      }`}
    >
      {status}
    </span>
  );
}
