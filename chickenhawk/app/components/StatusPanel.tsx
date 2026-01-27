"use client";

import React from "react";

interface ModuleStatus {
  name: string;
  status: "ready" | "loading" | "error" | "offline";
  port?: number;
}

interface StatusPanelProps {
  statuses: ModuleStatus[];
}

export function StatusPanel({ statuses }: StatusPanelProps) {
  const readyCount = statuses.filter(s => s.status === "ready").length;
  const totalCount = statuses.length;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${readyCount === totalCount ? "bg-green-500" : "bg-amber-500"}`} />
        <span className="text-sm text-gray-300">
          {readyCount}/{totalCount} Services
        </span>
      </div>
      <div className="h-4 w-px bg-white/10" />
      <div className="flex -space-x-1">
        {statuses.slice(0, 4).map((s, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-xs ${
              s.status === "ready" ? "bg-green-600" :
              s.status === "loading" ? "bg-amber-600" :
              s.status === "error" ? "bg-red-600" : "bg-gray-600"
            }`}
            title={`${s.name}: ${s.status}${s.port ? ` (${s.port})` : ""}`}
          >
            {s.name.charAt(0)}
          </div>
        ))}
        {statuses.length > 4 && (
          <div className="w-6 h-6 rounded-full border-2 border-[#0a0a0a] bg-white/10 flex items-center justify-center text-xs">
            +{statuses.length - 4}
          </div>
        )}
      </div>
    </div>
  );
}
