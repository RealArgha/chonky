"use client";

import { useEffect, useState } from "react";

export function DaysTogether() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/together")
      .then((res) => res.json())
      .then((data: { since?: string | null }) => {
        if (!data.since) return;
        const sinceMs = new Date(data.since).getTime();
        if (Number.isNaN(sinceMs)) return;
        setDays(Math.floor((Date.now() - sinceMs) / 86_400_000));
      })
      .catch(() => {});
  }, []);

  if (days === null) return null;

  return (
    <p className="text-center font-pixel text-[8px] text-rose-700">
      ❤️ {days} {days === 1 ? "day" : "days"} together
    </p>
  );
}
