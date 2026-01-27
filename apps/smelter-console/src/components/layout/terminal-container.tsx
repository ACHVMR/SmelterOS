import React from 'react';

interface TerminalContainerProps {
  children: React.ReactNode;
  header?: string;
  className?: string;
}

export const TerminalContainer = ({ children, header = "root@smelter-os:~", className = "" }: TerminalContainerProps) => {
  return (
    <div className={`relative border border-terminal-green/30 bg-black/80 rounded-sm shadow-[0_0_15px_rgba(0,255,65,0.1)] backdrop-blur-sm overflow-hidden ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-terminal-green/10 border-b border-terminal-green/30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <div className="text-xs font-mono text-terminal-green/70 tracking-wider">
          {header}
        </div>
        <div className="w-12" /> {/* Spacer for centering */}
      </div>
      
      {/* Content */}
      <div className="p-4 font-mono text-sm text-gray-300">
        {children}
      </div>
      
      {/* Scanline Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%] z-50 opacity-10 mix-blend-overlay"></div>
    </div>
  );
};
