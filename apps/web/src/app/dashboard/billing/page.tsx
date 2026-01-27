"use client"

import React from "react"
import { Panel, StatusIndicator, Button, Progress, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Billing & Usage</h1>
          <p className="text-mono text-[rgb(var(--text-secondary))]">
            DASHBOARD // BILLING
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Usage Metrics */}
          <div className="lg:col-span-2 space-y-6">
            <Panel title="Resource Usage">
              <div className="space-y-6">
                {[
                  { name: "API Calls", used: 8432, total: 10000, unit: "calls" },
                  { name: "Storage", used: 45, total: 50, unit: "GB" },
                  { name: "Runtime Hours", used: 42, total: 100, unit: "hours" },
                  { name: "Agent Executions", used: 156, total: 1000, unit: "executions" }
                ].map((metric) => {
                  const percentage = (metric.used / metric.total) * 100
                  const status = percentage > 90 ? "error" : percentage > 75 ? "pending" : "active"
                  
                  return (
                    <div key={metric.name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">{metric.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-mono text-sm text-[rgb(var(--text-secondary))]">
                            {metric.used} / {metric.total} {metric.unit}
                          </span>
                          <StatusIndicator status={status} size="sm" showDot={false} label={`${percentage.toFixed(0)}%`} />
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </Panel>

            <Panel title="Cost Breakdown">
              <Table>
                <TableHeader>
                  <TableRow className="border-[rgb(var(--border-subtle))]">
                    <TableHead>Service</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-[rgb(var(--border-subtle))]">
                    <TableCell className="font-medium">AVVA NOON - Orchestration</TableCell>
                    <TableCell className="text-mono text-sm">42.3 hrs</TableCell>
                    <TableCell className="text-right text-[rgb(var(--status-success))]">$12.50</TableCell>
                  </TableRow>
                  <TableRow className="border-[rgb(var(--border-subtle))]">
                    <TableCell className="font-medium">ACHEEVY - Execution</TableCell>
                    <TableCell className="text-mono text-sm">156 runs</TableCell>
                    <TableCell className="text-right text-[rgb(var(--status-success))]">$8.20</TableCell>
                  </TableRow>
                  <TableRow className="border-[rgb(var(--border-subtle))]">
                    <TableCell className="font-medium">API Calls</TableCell>
                    <TableCell className="text-mono text-sm">8,432 calls</TableCell>
                    <TableCell className="text-right text-[rgb(var(--status-success))]">$4.55</TableCell>
                  </TableRow>
                  <TableRow className="border-[rgb(var(--border-subtle))]">
                    <TableCell className="font-medium">Storage</TableCell>
                    <TableCell className="text-mono text-sm">45 GB</TableCell>
                    <TableCell className="text-right text-[rgb(var(--status-success))]">$2.25</TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 border-[rgb(var(--border-default))]">
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-bold text-lg text-[rgb(var(--text-primary))]">$27.50</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Panel>

            <Panel title="Recent Invoices">
              <div className="space-y-2">
                {[
                  { id: "INV-2024-001", date: "Jan 1, 2024", amount: "$27.50", status: "paid" },
                  { id: "INV-2023-012", date: "Dec 1, 2023", amount: "$29.00", status: "paid" },
                  { id: "INV-2023-011", date: "Nov 1, 2023", amount: "$24.80", status: "paid" }
                ].map((invoice) => (
                  <Card key={invoice.id} className="bg-[rgb(var(--bg-elevated))] border-[rgb(var(--border-subtle))]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-mono">{invoice.id}</div>
                          <div className="text-sm text-[rgb(var(--text-secondary))]">{invoice.date}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-semibold">{invoice.amount}</div>
                          <StatusIndicator status="active" size="sm" label={invoice.status.toUpperCase()} />
                          <Button size="sm" variant="outline">Download</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Panel>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Panel title="Current Plan">
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold mb-1">Pro Plan</div>
                  <div className="text-[rgb(var(--text-secondary))] text-sm">$29/month</div>
                </div>
                <StatusIndicator status="active" label="ACTIVE" />
                <div className="pt-4 border-t border-[rgb(var(--border-subtle))]">
                  <div className="text-sm text-[rgb(var(--text-secondary))] mb-1">Next billing date</div>
                  <div className="font-semibold">Feb 1, 2024</div>
                </div>
                <Button className="w-full bg-[rgb(var(--accent-green))] text-black hover:bg-[rgb(var(--accent-green))]/90">
                  Manage Plan
                </Button>
              </div>
            </Panel>

            <Panel title="Payment Method">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-[rgb(var(--bg-elevated))] rounded flex items-center justify-center border border-[rgb(var(--border-subtle))]">
                    <span className="text-xs font-bold">VISA</span>
                  </div>
                  <div>
                    <div className="font-medium text-mono">•••• 4242</div>
                    <div className="text-sm text-[rgb(var(--text-secondary))]">Expires 12/25</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">Update</Button>
              </div>
            </Panel>

            <Panel className="p-6 bg-gradient-to-br from-[rgb(var(--bg-card))] to-[rgb(var(--bg-elevated))]">
              <div className="text-sm font-semibold mb-2 text-[rgb(var(--status-warning))]">Usage Alert</div>
              <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
                You're at 90% of your storage limit. Consider upgrading your plan.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Upgrade Now
              </Button>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
