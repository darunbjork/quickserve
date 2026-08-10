// * WHY: Docker and Kubernetes need a uniform way to determine if a container should receive traffic.
// ! We define a standard interface here. Each service will implement this class, inject its specific 
// ? dependencies (Prisma, Redis), and expose a standard /health/ready endpoint.
export type HealthStatus = 'pass' | 'fail' | 'warn';

export interface HealthCheckResult {
  status: HealthStatus;
  service: string;
  timestamp: string;
  checks: Record<string, HealthStatus>;
}