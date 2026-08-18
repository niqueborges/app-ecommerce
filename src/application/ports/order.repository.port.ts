export interface OrderRepositoryPort {
  findById(id: string): Promise<unknown>;
  findByIdempotencyKey(key: string): Promise<unknown>;
  create(
    userId: string,
    totalInCents: number,
    idempotencyKey: string | undefined,
    items: unknown[],
    tx?: unknown
  ): Promise<unknown>;
  findByUserId(userId: string): Promise<unknown[]>;
}
