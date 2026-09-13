export class DesignProjectNotFoundError extends Error {
  constructor(public projectId: string) {
    super(`Design project with ID ${projectId} not found`);
    this.name = 'DesignProjectNotFoundError';
  }
}

export class StateConflictError extends Error {
  constructor(public currentStage: string, public targetStage: string) {
    super(`Cannot transition project from ${currentStage} to ${targetStage}`);
    this.name = 'StateConflictError';
  }
}

export class ConcurrencyError extends Error {
  constructor() {
    super('The project was updated by another process. Please refresh and try again.');
    this.name = 'ConcurrencyError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Not authorized to perform this action on this project') {
    super(message);
    this.name = 'AuthorizationError';
  }
}
