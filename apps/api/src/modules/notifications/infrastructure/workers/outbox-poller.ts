import { ProcessOutboxRelayUseCase } from '../../application/notifications.use-cases';

export class OutboxPoller {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly processUseCase: ProcessOutboxRelayUseCase,
    private readonly intervalMs: number = 10000 // default 10 seconds
  ) {}

  start() {
    if (this.timer) {
      return;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.timer = setInterval(async () => {
      await this.runIteration();
    }, this.intervalMs);

    // Initial run
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.runIteration();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async runIteration() {
    if (this.isRunning) {
      return; // prevent overlapping runs
    }
    this.isRunning = true;
    try {
      await this.processUseCase.execute();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[OutboxPoller] Fatal error during iteration:', error);
    } finally {
      this.isRunning = false;
    }
  }
}
