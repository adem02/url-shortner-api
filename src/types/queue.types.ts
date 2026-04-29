export type EventType = 'click.save';

export interface DomainEvent<T> {
  type: EventType;
  occuredAt: string;
  payload: T;
}

export interface QueueHandler<T> {
  handle(event: T): Promise<void>;
}

export const QUEUE_NAME = 'eventQueue';
