"use client";

import React from "react";

export interface Lead {
  id: string;
  phone?: string | null;
  email?: string | null;
}

interface LeadActionBarProps {
  lead: Lead;
  current: number;
  total: number;
  onNext: () => void;
  onPrev?: () => void;
  meetingUrl?: string;
  className?: string;
}

export default function LeadActionBar({
  lead,
  current,
  total,
  onNext,
  onPrev,
  meetingUrl = "https://calendly.com/traffikboosters",
  className = "",
}: LeadActionBarProps) {
  const phone = lead?.phone?.trim() ?? "";
  const email = lead?.email?.trim() ?? "";

  const hasPhone = phone.length > 0;
  const hasEmail = email.length > 0;

  const canGoPrev = typeof onPrev === "function" && current > 0;
  const canGoNext = current < total - 1;

  const handleCall = () => {
    if (!hasPhone) return;
    const sanitizedPhone = phone.replace(/[^\d+]/g, "");
    window.location.href = `tel:${encodeURIComponent(sanitizedPhone)}`;
  };

  const handleEmail = () => {
    if (!hasEmail) return;
    window.location.href = `mailto:${encodeURIComponent(email)}`;
  };

  const handleMeeting = () => {
    window.open(meetingUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleCall}
        disabled={!hasPhone}
        className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        title={hasPhone ? `Call ${phone}` : "No phone number available"}
      >
        📞 Call
      </button>

      <button
        type="button"
        onClick={handleEmail}
        disabled={!hasEmail}
        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        title={hasEmail ? `Email ${email}` : "No email available"}
      >
        📧 Email
      </button>

      <button
        type="button"
        onClick={handleMeeting}
        className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white"
        title="Open meeting link"
      >
        🎥 Meeting
      </button>

      {onPrev && (
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev}
          className="rounded-md bg-zinc-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Prev Lead
        </button>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className="rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next Lead →
      </button>

      <span className="ml-1 text-sm text-zinc-400">
        {total > 0 ? `${current + 1} / ${total}` : "0 / 0"}
      </span>
    </div>
  );
}