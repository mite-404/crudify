export interface IResponse<T> {
  results: T[];
  total: number;
  page: number;
}
