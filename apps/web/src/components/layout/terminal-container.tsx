import React from "react";

interface TerminalContainerProps {
  children: React.ReactNode;
  header?: string;
  className?: string;
}

export function TerminalContainer({
  children,
  header = "root@smelter:~",
  className = "",
}: TerminalContainerProps) {
  return (
    <div
      className={`border border-terminal-green/30 bg-obsidian/90 rounded-none overflow-hidden shadow-[0_0_15px_rgba(0,255,65,0.1)] ${className}`}
    >
      <div className="bg-terminal-green/10 px-4 py-1 border-b border-terminal-green/30 flex justify-between items-center text-xs font-mono text-terminal-green">
        <span>{header}</span>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-terminal-green/50"></div>
          <div className="w-2 h-2 rounded-full bg-terminal-green/50"></div>
          <div className="w-2 h-2 rounded-full bg-terminal-green/50"></div>
        </div>
      </div>
      <div className="p-4 md:p-6 font-mono text-sm md:text-base text-gray-300">
        {children}
      </div>
    </div>
  );
}
