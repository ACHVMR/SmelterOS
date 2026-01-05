/**
 * p95 Latency Validation Script
 * Validates that load test results meet production requirements
 * 
 * Requirements:
 * - p95 latency < 50ms
 * - Error rate < 0.1%
 * - p99 latency < 100ms (warning threshold)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  p95ThresholdMs: 50,
  p99WarningMs: 100,
  maxErrorRate: 0.001, // 0.1%
  minSuccessRate: 0.999,
};

/**
 * Load and parse Artillery report
 */
function loadReport(reportPath) {
  const fullPath = path.resolve(__dirname, '..', 'reports', reportPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`Report not found: ${fullPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Extract key metrics from Artillery report
 */
function extractMetrics(report) {
  const aggregate = report.aggregate;
  
  if (!aggregate) {
    throw new Error('No aggregate data in report');
  }

  const latency = aggregate.latency || {};
  const counters = aggregate.counters || {};

  return {
    // Latency percentiles
    p50: latency.p50 || 0,
    p75: latency.p75 || 0,
    p95: latency.p95 || 0,
    p99: latency.p99 || 0,
    median: latency.median || 0,
    min: latency.min || 0,
    max: latency.max || 0,

    // Request counts
    totalRequests: counters['http.requests'] || 0,
    successfulRequests: counters['http.responses'] || 0,
    failedRequests: counters['http.request_rate'] || 0,

    // Status codes
    http2xx: counters['http.codes.2xx'] || 0,
    http4xx: counters['http.codes.4xx'] || 0,
    http5xx: counters['http.codes.5xx'] || 0,

    // Computed metrics
    errorRate: 0,
    successRate: 0,
  };
}

/**
 * Compute derived metrics
 */
function computeDerivedMetrics(metrics) {
  const total = metrics.http2xx + metrics.http4xx + metrics.http5xx;
  
  if (total > 0) {
    metrics.errorRate = (metrics.http4xx + metrics.http5xx) / total;
    metrics.successRate = metrics.http2xx / total;
  }

  return metrics;
}

/**
 * Validate metrics against thresholds
 */
function validateMetrics(metrics, config = CONFIG) {
  const results = {
    passed: true,
    checks: [],
    warnings: [],
  };

  // Check p95 latency
  if (metrics.p95 > config.p95ThresholdMs) {
    results.passed = false;
    results.checks.push({
      name: 'p95 Latency',
      status: 'FAILED',
      expected: `< ${config.p95ThresholdMs}ms`,
      actual: `${metrics.p95}ms`,
    });
  } else {
    results.checks.push({
      name: 'p95 Latency',
      status: 'PASSED',
      expected: `< ${config.p95ThresholdMs}ms`,
      actual: `${metrics.p95}ms`,
    });
  }

  // Check error rate
  if (metrics.errorRate > config.maxErrorRate) {
    results.passed = false;
    results.checks.push({
      name: 'Error Rate',
      status: 'FAILED',
      expected: `< ${config.maxErrorRate * 100}%`,
      actual: `${(metrics.errorRate * 100).toFixed(3)}%`,
    });
  } else {
    results.checks.push({
      name: 'Error Rate',
      status: 'PASSED',
      expected: `< ${config.maxErrorRate * 100}%`,
      actual: `${(metrics.errorRate * 100).toFixed(3)}%`,
    });
  }

  // Check p99 latency (warning)
  if (metrics.p99 > config.p99WarningMs) {
    results.warnings.push({
      name: 'p99 Latency',
      message: `p99 latency (${metrics.p99}ms) exceeds warning threshold (${config.p99WarningMs}ms)`,
    });
  }

  // Check for high 5xx errors
  const http5xxRate = metrics.http5xx / (metrics.http2xx + metrics.http4xx + metrics.http5xx);
  if (http5xxRate > 0.001) {
    results.warnings.push({
      name: '5xx Errors',
      message: `5xx error rate (${(http5xxRate * 100).toFixed(3)}%) is elevated`,
    });
  }

  return results;
}

/**
 * Print validation report
 */
function printReport(metrics, validation) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('             SmelterOS Load Test Validation Report');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Latency summary
  console.log('📊 Latency Summary:');
  console.log(`   p50:    ${metrics.p50}ms`);
  console.log(`   p75:    ${metrics.p75}ms`);
  console.log(`   p95:    ${metrics.p95}ms`);
  console.log(`   p99:    ${metrics.p99}ms`);
  console.log(`   max:    ${metrics.max}ms\n`);

  // Request summary
  console.log('📈 Request Summary:');
  console.log(`   Total:    ${metrics.totalRequests}`);
  console.log(`   2xx:      ${metrics.http2xx}`);
  console.log(`   4xx:      ${metrics.http4xx}`);
  console.log(`   5xx:      ${metrics.http5xx}`);
  console.log(`   Success:  ${(metrics.successRate * 100).toFixed(2)}%\n`);

  // Validation checks
  console.log('✅ Validation Checks:');
  for (const check of validation.checks) {
    const icon = check.status === 'PASSED' ? '✓' : '✗';
    const color = check.status === 'PASSED' ? '\x1b[32m' : '\x1b[31m';
    console.log(`   ${color}${icon}\x1b[0m ${check.name}: ${check.actual} (expected ${check.expected})`);
  }

  // Warnings
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of validation.warnings) {
      console.log(`   - ${warning.message}`);
    }
  }

  // Final result
  console.log('\n───────────────────────────────────────────────────────────────');
  if (validation.passed) {
    console.log('\x1b[32m✓ ALL CHECKS PASSED - Ready for production deployment\x1b[0m\n');
  } else {
    console.log('\x1b[31m✗ VALIDATION FAILED - Do not deploy to production\x1b[0m\n');
  }
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  const reportFile = args[0] || 'api-report.json';

  console.log(`\nValidating report: ${reportFile}`);

  try {
    const report = loadReport(reportFile);
    let metrics = extractMetrics(report);
    metrics = computeDerivedMetrics(metrics);
    const validation = validateMetrics(metrics);
    
    printReport(metrics, validation);

    // Exit with appropriate code
    process.exit(validation.passed ? 0 : 1);
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

main();
