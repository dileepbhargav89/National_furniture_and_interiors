export enum DomainEventType {
  LEAD_CREATED = 'LeadCreated',
  ORDER_PAID = 'OrderPaid',
  PROJECT_STAGE_CHANGED = 'ProjectStageChanged',
  PAYMENT_CAPTURED = 'PaymentCaptured',
}

export interface DomainEvent<T = unknown> {
  eventType: DomainEventType;
  aggregateType: string;
  aggregateId: string;
  payload: T;
}

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export interface OutboxMessage {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  attempts: number;
  processedAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}
