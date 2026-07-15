export class ClientError extends Error {
  constructor(
    public readonly code: string,
    public readonly params: Record<string, string | number> = {}
  ) {
    super(code);
    this.name = 'ClientError';
  }
}
