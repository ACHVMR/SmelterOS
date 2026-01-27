"use client"

import React from "react"
import { Panel, StatusIndicator, Button, Switch, Progress } from "@/components/ui"

export default function GovernancePage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Governance Hub</h1>
          <p className="text-mono text-[rgb(var(--text-secondary))]">
            SYSTEM MANAGEMENT // CIRCUIT BOX
          </p>
        </div>

        {/* Circuit Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {[
            { id: 1, name: "Agent Control", circuits: ["AVVA NOON", "ACHEEVY", "Zero_Ang"], status: "active" },
            { id: 2, name: "Repositories", circuits: ["Core", "UI", "Docs"], status: "active" },
            { id: 3, name: "Integrations", circuits: ["GitHub", "Stripe", "Firebase"], status: "active" },
            { id: 4, name: "Voice & STT/TTS", circuits: ["ElevenLabs", "Deepgram"], status: "active" },
            { id: 5, name: "Infrastructure", circuits: ["Docker", "Cloud Run"], status: "active" }
          ].map((panel) => (
            <Panel key={panel.id} title={`Panel ${panel.id}`} className="border-2 hover:border-[rgb(var(--accent-cyan))] transition">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[rgb(var(--accent-cyan))] mb-2">{panel.name}</div>
                {panel.circuits.map((circuit) => (
                  <div key={circuit} className="flex items-center justify-between p-2 bg-[rgb(var(--bg-elevated))] rounded">
                    <span className="text-sm">{circuit}</span>
                    <Switch defaultChecked />
                  </div>
                ))}
                <StatusIndicator status={panel.status as any} size="sm" label="HEALTHY" />
              </div>
            </Panel>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Proposals */}
          <div className="lg:col-span-2">
            <Panel title="Active Governance Proposals">
              <div className="space-y-4">
                {[
                  { id: "GOV-001", title: "Upgrade AVVA NOON to v2.0", votes: 85, total: 100, status: "pending" },
                  { id: "GOV-002", title: "Enable automatic V.I.B.E. enforcement", votes: 92, total: 100, status: "pending" },
                  { id: "GOV-003", title: "Increase FDH efficiency target to 95%", votes: 67, total: 100, status: "active" }
                ].map((proposal) => (
                  <div key={proposal.id} className="p-4 bg-[rgb(var(--bg-elevated))] rounded-lg border border-[rgb(var(--border-subtle))]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-mono text-xs text-[rgb(var(--text-secondary))] mb-1">{proposal.id}</div>
                        <div className="font-semibold">{proposal.title}</div>
                      </div>
                     <StatusIndicator status={proposal.status as any} size="sm" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[rgb(var(--text-secondary))]">Votes</span>
                        <span className="text-mono">{proposal.votes} / {proposal.total}</span>
                      </div>
                      <Progress value={(proposal.votes / proposal.total) * 100} className="h-2" />
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1 text-[rgb(var(--status-success))]">
                          Vote Yes
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-[rgb(var(--status-error))]">
                          Vote No
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* System Logs */}
          <Panel title="System Logs">
            <div className="space-y-2 font-mono text-xs">
              {[
                { time: "10:45:32", level: "INFO", msg: "All circuits nominal" },
                { time: "10:44:18", level: "SUCCESS", msg: "Proposal GOV-002 passed" },
                { time: "10:42:05", level: "WARN", msg: "Panel 3 - High load detected" },
                { time: "10:40:12", level: "INFO", msg: "AVVA NOON status: OPTIMAL" }
              ].map((log, idx) => (
                <div key={idx} className={`p-2 rounded ${
                  log.level === 'SUCCESS' ? 'bg-[rgb(var(--status-success))]/10' :
                  log.level === 'WARN' ? 'bg-[rgb(var(--status-warning))]/10' :
                  'bg-[rgb(var(--bg-elevated))]'
                }`}>
                  <span className="text-[rgb(var(--text-muted))]">[{log.time}]</span>{' '}
                  <span className={
                    log.level === 'SUCCESS' ? 'text-[rgb(var(--status-success))]' :
                    log.level === 'WARN' ? 'text-[rgb(var(--status-warning))]' :
                    'text-[rgb(var(--status-info))]'
                  }>{log.level}</span>{' '}
                  {log.msg}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
