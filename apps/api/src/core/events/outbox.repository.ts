import { DomainEvent, OutboxMessage, OutboxStatus } from './domain-events';
import { OutboxModel } from './outbox.model';

export interface IOutboxRepository {
  /**
   * Appends an event to the outbox.
   * If a session is provided, it participates in a MongoDB transaction.
   */
  append(event: DomainEvent, session?: any): Promise<void>;

  /**
   * Fetches pending events for the relay poller.
   */
  findPending(limit?: number): Promise<OutboxMessage[]>;

  /**
   * Marks an event as processed.
   */
  markProcessed(id: string): Promise<void>;

  /**
   * Marks an event as failed and increments attempts.
   */
  markFailed(id: string, error: string): Promise<void>;
}

export class MongoOutboxRepository implements IOutboxRepository {
  async append(event: DomainEvent, session?: any): Promise<void> {
    const doc = new OutboxModel({
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: event.payload,
    });
    
    if (session) {
      await doc.save({ session });
    } else {
      await doc.save();
    }
  }

  async findPending(limit = 50): Promise<OutboxMessage[]> {
    const docs = await OutboxModel.find({ status: OutboxStatus.PENDING })
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      eventType: doc.eventType,
      aggregateType: doc.aggregateType,
      aggregateId: doc.aggregateId.toString(),
      payload: doc.payload as Record<string, unknown>,
      status: doc.status as OutboxStatus,
      attempts: doc.attempts,
      processedAt: doc.processedAt ?? undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  async markProcessed(id: string): Promise<void> {
    await OutboxModel.findByIdAndUpdate(id, {
      status: OutboxStatus.PROCESSED,
      processedAt: new Date(),
    });
  }

  async markFailed(id: string, _error: string): Promise<void> {
    await OutboxModel.findByIdAndUpdate(id, {
      status: OutboxStatus.FAILED,
      $inc: { attempts: 1 },
    });
  }
}
