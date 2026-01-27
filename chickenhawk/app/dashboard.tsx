"use client";

import React, { useState, useEffect } from "react";

interface DashboardMetrics {
  activeAgents: number;
  requestsToday: number;
  tokenUsage: number;
  memoryEntries: number;
}

interface ServiceStatus {
  name: string;
  status: "online" | "offline" | "degraded";
  port: number;
  latency?: number;
}

export default function ChickenHawkDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeAgents: 4,
    requestsToday: 1247,
    tokenUsage: 2450000,
    memoryEntries: 156,
  });

  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Oracle Gateway", status: "online", port: 8090, latency: 12 },
    { name: "Agent Zero", status: "online", port: 50001, latency: 45 },
    { name: "II-Agent", status: "online", port: 8091, latency: 23 },
    { name: "Codex", status: "online", port: 8092, latency: 18 },
    { name: "Confucius", status: "online", port: 8093, latency: 15 },
    { name: "Billing Bridge", status: "online", port: 8094, latency: 8 },
  ]);

  const [recentActivity, setRecentActivity] = useState([
    { time: "2 min ago", agent: "ii-researcher", action: "Deep search completed", status: "success" },
    { time: "5 min ago", agent: "codex", action: "Code generation", status: "success" },
    { time: "12 min ago", agent: "agent-zero", action: "Task execution", status: "success" },
    { time: "18 min ago", agent: "ii-agent", action: "Browser automation", status: "warning" },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0a1010] to-[#100a0a] text-white p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🦅</div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
              Chicken Hawk Dashboard
            </h1>
            <p className="text-gray-400">SmelterOS Control Center</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 transition-all">
            + New Task
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
            Settings
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Active Agents"
          value={metrics.activeAgents}
          icon="🤖"
          color="cyan"
        />
        <MetricCard
          title="Requests Today"
          value={metrics.requestsToday.toLocaleString()}
          icon="📊"
          color="green"
        />
        <MetricCard
          title="Token Usage"
          value={`${(metrics.tokenUsage / 1000000).toFixed(1)}M`}
          icon="⚡"
          color="orange"
        />
        <MetricCard
          title="Memory Entries"
          value={metrics.memoryEntries}
          icon="🧠"
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Panel */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">Service Status</h2>
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 bg-black/30 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      service.status === "online"
                        ? "bg-green-500"
                        : service.status === "degraded"
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-gray-400">Port {service.port}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-400">{service.latency}ms</p>
                  <p className="text-xs text-gray-500">{service.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 pb-4 border-b border-white/5 last:border-0"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === "success"
                      ? "bg-green-500"
                      : activity.status === "warning"
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400">
                      {activity.agent}
                    </span>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <QuickAction icon="🔬" label="Research" />
        <QuickAction icon="⚡" label="Generate Code" />
        <QuickAction icon="📊" label="Create Slides" />
        <QuickAction icon="🧠" label="CoT Lab" />
        <QuickAction icon="🐳" label="Agent Zero" />
        <QuickAction icon="💫" label="Gemini CLI" />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  const colorClasses = {
    cyan: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30",
    green: "from-green-500/20 to-green-600/5 border-green-500/30",
    orange: "from-orange-500/20 to-orange-600/5 border-orange-500/30",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/30",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border rounded-2xl p-6`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-gray-400 uppercase tracking-wide">{title}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function QuickAction({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm text-gray-300">{label}</span>
    </button>
  );
}
