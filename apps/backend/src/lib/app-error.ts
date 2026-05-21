export class AppError extends Error {
  public readonly statusCode: number;

  public readonly details?: string[];

  constructor(message: string, statusCode = 500, details?: string[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
