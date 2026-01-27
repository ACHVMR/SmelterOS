/**
 * A2UI Protocol Integration for Chicken Hawk Mode
 * 
 * Enables agents to generate rich, interactive UIs on-the-fly.
 * Based on Google's A2UI specification for native component rendering.
 */

export interface A2UIMessage {
  type: "component" | "update" | "action" | "stream";
  componentType: string;
  props: Record<string, unknown>;
  children?: A2UIMessage[];
  streamId?: string;
}

export interface ComponentCatalogEntry {
  name: string;
  allowedProps: string[];
  renderer: (props: Record<string, unknown>) => HTMLElement | null;
}

export interface A2UIRendererConfig {
  mountPoint: string;
  catalog: Record<string, ComponentCatalogEntry>;
  onError?: (error: Error) => void;
}

class ChickenHawkA2UIRenderer {
  private config: A2UIRendererConfig;
  private mountElement: HTMLElement | null = null;
  private activeStreams: Map<string, AsyncGenerator<A2UIMessage>> = new Map();

  constructor(config: A2UIRendererConfig) {
    this.config = config;
  }

  initialize(): void {
    if (typeof window !== "undefined") {
      this.mountElement = document.querySelector(this.config.mountPoint);
      if (!this.mountElement) {
        console.warn(`A2UI: Mount point ${this.config.mountPoint} not found`);
      }
    }
  }

  async renderAgentUI(stream: AsyncIterable<A2UIMessage>): Promise<void> {
    for await (const message of stream) {
      try {
        await this.processMessage(message);
      } catch (error) {
        this.config.onError?.(error as Error);
      }
    }
  }

  private async processMessage(message: A2UIMessage): Promise<void> {
    switch (message.type) {
      case "component":
        this.renderComponent(message);
        break;
      case "update":
        this.updateComponent(message);
        break;
      case "action":
        this.handleAction(message);
        break;
      case "stream":
        this.handleStream(message);
        break;
    }
  }

  private renderComponent(message: A2UIMessage): void {
    const catalogEntry = this.config.catalog[message.componentType];
    if (!catalogEntry) {
      console.warn(`A2UI: Unknown component type: ${message.componentType}`);
      return;
    }

    const element = catalogEntry.renderer(message.props);
    if (element && this.mountElement) {
      this.mountElement.appendChild(element);
    }
  }

  private updateComponent(message: A2UIMessage): void {
    // Update existing component by ID
    const targetId = message.props.targetId as string;
    if (targetId && typeof window !== "undefined") {
      const target = document.getElementById(targetId);
      if (target) {
        Object.entries(message.props).forEach(([key, value]) => {
          if (key !== "targetId") {
            (target as Record<string, unknown>)[key] = value;
          }
        });
      }
    }
  }

  private handleAction(message: A2UIMessage): void {
    const actionType = message.props.action as string;
    console.log(`A2UI Action: ${actionType}`, message.props);
    // Dispatch to appropriate handler
  }

  private handleStream(message: A2UIMessage): void {
    if (message.streamId) {
      console.log(`A2UI Stream: ${message.streamId}`, message.props);
    }
  }

  // Public API for agent integration
  async handleResearchOutput(data: ResearchResult): Promise<void> {
    const chartMessage: A2UIMessage = {
      type: "component",
      componentType: "chart",
      props: {
        data: data.dataPoints,
        title: data.title,
        type: "bar",
      },
    };
    await this.processMessage(chartMessage);
  }

  async handleFormRequest(formConfig: FormConfig): Promise<void> {
    const formMessage: A2UIMessage = {
      type: "component",
      componentType: "form",
      props: {
        fields: formConfig.fields,
        submitLabel: formConfig.submitLabel,
        onSubmit: formConfig.onSubmit,
      },
    };
    await this.processMessage(formMessage);
  }

  async handleTableData(tableConfig: TableConfig): Promise<void> {
    const tableMessage: A2UIMessage = {
      type: "component",
      componentType: "table",
      props: {
        columns: tableConfig.columns,
        rows: tableConfig.rows,
        sortable: tableConfig.sortable,
      },
    };
    await this.processMessage(tableMessage);
  }
}

// Type definitions
interface ResearchResult {
  title: string;
  dataPoints: Array<{ label: string; value: number }>;
  sources: string[];
}

interface FormConfig {
  fields: Array<{ name: string; type: string; label: string }>;
  submitLabel: string;
  onSubmit: (data: Record<string, unknown>) => void;
}

interface TableConfig {
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, unknown>>;
  sortable?: boolean;
}

// Default component catalog
export const DEFAULT_CATALOG: Record<string, ComponentCatalogEntry> = {
  chart: {
    name: "Chart",
    allowedProps: ["data", "title", "type", "width", "height"],
    renderer: (props) => {
      if (typeof window === "undefined") return null;
      const div = document.createElement("div");
      div.className = "a2ui-chart";
      div.innerHTML = `<div class="chart-placeholder">Chart: ${props.title}</div>`;
      return div;
    },
  },
  form: {
    name: "Form",
    allowedProps: ["fields", "submitLabel", "onSubmit"],
    renderer: (props) => {
      if (typeof window === "undefined") return null;
      const form = document.createElement("form");
      form.className = "a2ui-form";
      const fields = props.fields as Array<{ name: string; type: string; label: string }>;
      fields?.forEach((field) => {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = `
          <label>${field.label}</label>
          <input type="${field.type}" name="${field.name}" />
        `;
        form.appendChild(wrapper);
      });
      return form;
    },
  },
  table: {
    name: "Table",
    allowedProps: ["columns", "rows", "sortable"],
    renderer: (props) => {
      if (typeof window === "undefined") return null;
      const table = document.createElement("table");
      table.className = "a2ui-table";
      const columns = props.columns as Array<{ key: string; label: string }>;
      const rows = props.rows as Array<Record<string, unknown>>;
      
      // Header
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      columns?.forEach((col) => {
        const th = document.createElement("th");
        th.textContent = col.label;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Body
      const tbody = document.createElement("tbody");
      rows?.forEach((row) => {
        const tr = document.createElement("tr");
        columns?.forEach((col) => {
          const td = document.createElement("td");
          td.textContent = String(row[col.key] ?? "");
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      return table;
    },
  },
  card: {
    name: "Card",
    allowedProps: ["title", "content", "actions"],
    renderer: (props) => {
      if (typeof window === "undefined") return null;
      const card = document.createElement("div");
      card.className = "a2ui-card";
      card.innerHTML = `
        <h3>${props.title}</h3>
        <p>${props.content}</p>
      `;
      return card;
    },
  },
};

export { ChickenHawkA2UIRenderer };
export type { ResearchResult, FormConfig, TableConfig };
