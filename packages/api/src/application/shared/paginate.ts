import { Paginated, PaginationParams } from '@alentapp/shared';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface NormalizedPagination {
  page: number;
  page_size: number;
  skip: number;
  take: number;
}

export function applyPagination(params?: PaginationParams): NormalizedPagination {
  const page = params?.page ?? DEFAULT_PAGE;
  const page_size = params?.page_size ?? DEFAULT_PAGE_SIZE;
  return {
    page,
    page_size,
    skip: (page - 1) * page_size,
    take: page_size,
  };
}

export function buildPaginated<T>(args: {
  page: number;
  page_size: number;
  total: number;
  data: T[];
}): Paginated<T> {
  return {
    data: args.data,
    pagination: {
      page: args.page,
      page_size: args.page_size,
      total: args.total,
      total_pages: args.page_size > 0 ? Math.ceil(args.total / args.page_size) : 0,
    },
  };
}
