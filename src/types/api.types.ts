export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
