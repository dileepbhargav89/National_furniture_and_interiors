// Structured logging factory — docs/07_technology_decision_record.md §15.1 (Pino, LOCKED),
// docs/06_project_structure.md §4.2 ("every layer logs through this, never console.log").
import pino from 'pino';
import { env } from '../config';

export const logger = pino({
  level: env.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
});
