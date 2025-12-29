import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { Contact, PaginatedResponse } from "@shared/types";

/**
 * Query keys for contacts
 */
export const contactKeys = {
    all: ["contacts"] as const,
    lists: () => [...contactKeys.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
        [...contactKeys.lists(), params] as const,
    details: () => [...contactKeys.all, "detail"] as const,
    detail: (id: number) => [...contactKeys.details(), id] as const,
};

/**
 * Fetch paginated contacts list
 */
export function useContacts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    device_id?: string | number;
}) {
    const page = params?.page ?? 1;
    const perPage = params?.per_page ?? 15;

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("per_page", String(perPage));
    if (params?.search) query.set("search", params.search);
    if (params?.device_id) query.set("device_id", String(params.device_id));

    return useQuery({
        queryKey: contactKeys.list({ page, per_page: perPage, search: params?.search, device_id: params?.device_id }),
        queryFn: async () => {
            // Some endpoints in this project return Laravel's default paginator shape,
            // others return a JSON:API-like { data, meta, links } shape. Adapt to both.

            type LaravelPaginator<T> = {
                data: T[];
                current_page: number;
                from: number | null;
                last_page: number;
                per_page: number;
                to: number | null;
                total: number;
                first_page_url?: string;
                last_page_url?: string;
                prev_page_url?: string | null;
                next_page_url?: string | null;
            };

            const raw = await api.get<PaginatedResponse<Contact> | LaravelPaginator<Contact>>(
                `/api/v1/admin/contacts?${query.toString()}`
            );

            const isJsonApiPaginated = (
                value: unknown
            ): value is PaginatedResponse<Contact> => {
                if (typeof value !== "object" || value === null) return false;

                const v = value as {
                    data?: unknown;
                    meta?: unknown;
                    links?: unknown;
                };

                const hasDataArray = Array.isArray(v.data);
                const hasMetaObject = typeof v.meta === "object" && v.meta !== null;
                const hasLinksObject = typeof v.links === "object" && v.links !== null;

                return hasDataArray && hasMetaObject && hasLinksObject;
            };

            if (isJsonApiPaginated(raw)) {
                return raw;
            }

            const r = raw as LaravelPaginator<Contact>;

            // Fallback transform for default Laravel paginator response
            // Expected keys: data, current_page, last_page, per_page, from, to, total, first_page_url, last_page_url, prev_page_url, next_page_url
            const transformed: PaginatedResponse<Contact> = {
                data: r.data ?? [],
                meta: {
                    current_page: r.current_page ?? page,
                    from: r.from ?? null,
                    last_page: r.last_page ?? 1,
                    per_page: r.per_page ?? perPage,
                    to: r.to ?? null,
                    total: r.total ?? (r.data?.length ?? 0),
                },
                links: {
                    first: r.first_page_url ?? "",
                    last: r.last_page_url ?? "",
                    prev: r.prev_page_url ?? null,
                    next: r.next_page_url ?? null,
                },
            };

            return transformed;
        },
    });
}
