// MongoDB/Mongoose connection factory — docs/06_project_structure.md §4.2, docs/03_database_design.md §14.2.
// The one connection module every module's infrastructure/ layer imports; migrations/seeds live in
// packages/database instead (offline schema evolution, a different concern).
import mongoose from 'mongoose';
import { env } from '../config';
import { logger } from '../logger';

let connectPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (!connectPromise) {
    connectPromise = mongoose
      .connect(env.MONGODB_URI)
      .then((connection) => {
        logger.info('MongoDB connected');
        return connection;
      })
      .catch((error: unknown) => {
        connectPromise = null;
        logger.error({ err: error }, 'MongoDB connection failed');
        throw error;
      });
  }
  return connectPromise;
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  connectPromise = null;
}

export { withTransaction } from './transaction';
