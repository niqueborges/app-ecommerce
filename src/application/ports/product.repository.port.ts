export interface ProductRepositoryPort {
  findByIds(ids: string[], tx?: unknown): Promise<unknown[]>;
  updateStock(id: string, quantityToSubtract: number, tx?: unknown): Promise<void>;
}
