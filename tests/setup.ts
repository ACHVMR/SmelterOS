/**
 * Jest Test Setup
 * Global configuration for all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Quiet logs during tests

// Mock timers if needed
// jest.useFakeTimers();

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Close any open connections
  // Clear any intervals/timeouts
});

// Mock console.log to reduce noise (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
// };

// Performance timing
if (typeof performance === 'undefined') {
  (global as any).performance = {
    now: () => Date.now(),
  };
}

// WebSocket mock for Node.js environment
if (typeof WebSocket === 'undefined') {
  (global as any).WebSocket = class MockWebSocket {
    onopen: (() => void) | null = null;
    onmessage: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    onclose: (() => void) | null = null;

    constructor(_url: string, _protocols?: string[]) {
      setTimeout(() => this.onopen?.(), 10);
    }

    send(_data: any) {}
    close() {
      this.onclose?.();
    }
  };
}
