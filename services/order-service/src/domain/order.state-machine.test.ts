import { describe, it, expect, vi } from 'vitest';

vi.mock('../generated/prisma-client', () => ({
  OrderStatus: {
    CREATED: 'CREATED',
    PREPARING: 'PREPARING',
    READY: 'READY',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
}));

import { OrderStateMachine } from './order.state-machine';
import { OrderStatus } from '../generated/prisma-client';

const LEGAL: ReadonlyArray<[OrderStatus, OrderStatus]> = [
  [OrderStatus.CREATED, OrderStatus.PREPARING],
  [OrderStatus.CREATED, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING, OrderStatus.READY],
  [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.READY, OrderStatus.COMPLETED],
];

const ILLEGAL: ReadonlyArray<[OrderStatus, OrderStatus]> = [
  [OrderStatus.CREATED, OrderStatus.READY],
  [OrderStatus.CREATED, OrderStatus.COMPLETED],
  [OrderStatus.PREPARING, OrderStatus.COMPLETED],
  [OrderStatus.READY, OrderStatus.CREATED],
  [OrderStatus.COMPLETED, OrderStatus.CREATED],
  [OrderStatus.COMPLETED, OrderStatus.READY],
  [OrderStatus.CANCELLED, OrderStatus.CREATED],
  [OrderStatus.CANCELLED, OrderStatus.PREPARING],
];

describe('OrderStateMachine', () => {
  it.each(LEGAL)('allows %s -> %s', (from, to) => {
    expect(() => OrderStateMachine.validateTransition(from, to)).not.toThrow();
  });

  it.each(ILLEGAL)('rejects %s -> %s', (from, to) => {
    expect(() => OrderStateMachine.validateTransition(from, to)).toThrow(
      /Invalid order status transition/,
    );
  });

  it('is a no-op when the status does not change', () => {
    for (const status of Object.values(OrderStatus)) {
      expect(() => OrderStateMachine.validateTransition(status, status)).not.toThrow();
    }
  });

  it('treats terminal states as terminal', () => {
    expect(() =>
      OrderStateMachine.validateTransition(OrderStatus.COMPLETED, OrderStatus.READY),
    ).toThrow();
    expect(() =>
      OrderStateMachine.validateTransition(OrderStatus.CANCELLED, OrderStatus.PREPARING),
    ).toThrow();
  });
});
