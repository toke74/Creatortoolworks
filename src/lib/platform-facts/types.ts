export interface PlatformFact<T> {
  key: string;
  value: T;
  sourceUrl: string;
  verifiedAt: string;
  notes?: string;
}
