"use client"

import React from "react"
import { Panel, StatusIndicator, Button, Progress, Card, CardContent } from "@/components/ui"

export default function MissionControlPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Mission Control</h1>
            <p className="text-mono text-[rgb(var(--text-secondary))]">
              DEPLOY PLATFORM // OVERSIGHT
            </p>
          </div>
          <Button className="bg-[rgb(var(--accent-green))] text-black">
            + Deploy New Agent
          </Button>
        </div>

        {/* Deployment List */}
        <Panel title="Active Deployments" className="mb-6">
          <div className="grid gap-4">
            {[
              { id: "DEP-001", name: "AVVA NOON", env: "Production", status: "active", uptime: "99.9%", load: 78 },
              { id: "DEP-002", name: "ACHEEVY", env: "Production", status: "active", uptime: "99.5%", load: 45 },
              { id: "DEP-003", name: "Zero_Ang", env: "Development", status: "inactive", uptime: "0%", load: 0 }
            ].map((deployment) => (
              <Card key={deployment.id} className="bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border-subtle))]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{deployment.name}</h3>
                        <StatusIndicator status={deployment.status as any} size="sm" />
                      </div>
                      <div className="flex gap-4 text-sm text-[rgb(var(--text-secondary))]">
                        <span className="text-mono">{deployment.id}</span>
                        <span>Environment: {deployment.env}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Logs</Button>
                      <Button size="sm" variant="outline">Settings</Button>
                      <Button size="sm" variant="outline" className="text-[rgb(var(--status-error))]">
                        Stop
                      </Button>
                    </div>
                  </div>
                  
                  {deployment.status === 'active' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-[rgb(var(--text-secondary))] mb-1">Uptime</div>
                        <div className="text-lg font-semibold text-[rgb(var(--status-success))]">{deployment.uptime}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[rgb(var(--text-secondary))] mb-1">Load</div>
                        <div className="text-lg font-semibold">{deployment.load}%</div>
                      </div>
                      <div>
                        <Progress value={deployment.load} className="h-2 mt-6" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </Panel>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Panel className="p-6">
            <div className="text-sm text-[rgb(var(--text-secondary))] mb-2">Total Deployments</div>
            <div className="text-3xl font-bold">3</div>
          </Panel>
          <Panel className="p-6">
            <div className="text-sm text-[rgb(var(--text-secondary))] mb-2">Active</div>
            <div className="text-3xl font-bold text-[rgb(var(--status-success))]">2</div>
          </Panel>
          <Panel className="p-6">
            <div className="text-sm text-[rgb(var(--text-secondary))] mb-2">Avg Response Time</div>
            <div className="text-3xl font-bold">120ms</div>
          </Panel>
          <Panel className="p-6">
            <div className="text-sm text-[rgb(var(--text-secondary))] mb-2">Success Rate</div>
            <div className="text-3xl font-bold text-[rgb(var(--status-success))]">99.6%</div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
