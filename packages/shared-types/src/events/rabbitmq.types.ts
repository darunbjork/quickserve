export enum EventTopic {
  ORDER_PLACED = 'order.placed',
  ORDER_ACCEPTED = 'order.accepted',
  ORDER_READY = 'order.ready',
  ORDER_COMPLETED = 'order.completed',
  ORDER_CANCELLED = 'order.cancelled',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed'
}

// * Base event enforces distributed tracing and idempotency rules
export interface BaseEvent {
  eventId: string; // ! Used by consumers to check processedEventId and ensure idempotency
  correlationId: string; // * Tracks the original HTTP request across multiple asynchronous services
  timestamp: string;
}

export interface OrderPlacedEvent extends BaseEvent {
  topic: EventTopic.ORDER_PLACED;
  payload: {
    orderId: string;
    storeId: string;
    customerId: string;
    items: Array<{ productId: string; quantity: number }>;
    totalAmount: number;
  };
}

// Union type of all possible events for the generic publisher/consumer
export type QuickServeEvent = OrderPlacedEvent;