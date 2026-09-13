import { Queue } from 'bullmq';
import { redisClient } from '../core/cache';

// Create BullMQ queues. Reusing the existing redisClient connection.
export const notificationsQueue = new Queue('notifications-queue', { connection: redisClient });
export const analyticsQueue = new Queue('analytics-queue', { connection: redisClient });
export const invoicesQueue = new Queue('invoices-queue', { connection: redisClient });
