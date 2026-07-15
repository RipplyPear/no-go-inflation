export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
    public readonly code = 'UNKNOWN_ERROR',
    public readonly params: Record<string, string | number> = {}
  ) {
    super(message);
    this.name = 'AppError';
  }
}
