import { Response } from 'express';

export function successResponse<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ data });
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  perPage: number,
  baseUrl = ''
): Response {
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const from = total > 0 ? (page - 1) * perPage + 1 : null;
  const to = total > 0 ? Math.min(page * perPage, total) : null;

  return res.status(200).json({
    data,
    meta: {
      current_page: page,
      from,
      last_page: lastPage,
      per_page: perPage,
      to,
      total,
    },
    links: {
      first: `${baseUrl}?page=1`,
      last: `${baseUrl}?page=${lastPage}`,
      prev: page > 1 ? `${baseUrl}?page=${page - 1}` : null,
      next: page < lastPage ? `${baseUrl}?page=${page + 1}` : null,
    },
  });
}

export function errorResponse(
  res: Response,
  message: string,
  status = 400,
  errors?: Record<string, string[]>
): Response {
  const payload: { message: string; errors?: Record<string, string[]> } = { message };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(status).json(payload);
}
