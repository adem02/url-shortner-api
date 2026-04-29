import { EventType, QueueHandler } from '@/types/queue.types';
import { SaveClickHandler } from './save-click.handler';
import { clickRepository } from '@/repositories/click.repository';

export const handlerRegistry: Array<{ type: EventType; handler: QueueHandler<unknown> }> = [
  { type: 'click.save', handler: new SaveClickHandler(clickRepository) },
];
