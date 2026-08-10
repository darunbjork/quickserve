export type HealthStatus = 'pass' | 'fail' | 'warn';

export interface HealthCheckResult {
  status: HealthStatus;
  service: string;
  timestamp: string;
  checks: Record<string, HealthStatus>;
}