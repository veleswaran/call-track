import { api } from "@shared/api/api";
import { PaginatedResponse } from "@shared/types";
import { CustomerSummaryItem, CustomerSummaryMetrics } from "../types";

export const customerSummaryApi = {
    async getSummary(params: Record<string, unknown> = {}): Promise<PaginatedResponse<CustomerSummaryItem>> {
        const queryParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                if (Array.isArray(value)) {
                    value.forEach((v) => queryParams.append(`${key}[]`, String(v)));
                } else if (typeof value === "boolean") {
                    if (value) queryParams.append(key, "1");
                } else {
                    queryParams.append(key, String(value));
                }
            }
        });

        const qs = queryParams.toString();
        const url = `/api/v1/admin/customer-summary${qs ? `?${qs}` : ""}`;
        return api.get<PaginatedResponse<CustomerSummaryItem>>(url);
    },

    async getMetrics(params: Record<string, unknown> = {}): Promise<{ data: CustomerSummaryMetrics }> {
        const queryParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                if (Array.isArray(value)) {
                    value.forEach((v) => queryParams.append(`${key}[]`, String(v)));
                } else if (typeof value === "boolean") {
                    if (value) queryParams.append(key, "1");
                } else {
                    queryParams.append(key, String(value));
                }
            }
        });

        const qs = queryParams.toString();
        const url = `/api/v1/admin/customer-summary/metrics${qs ? `?${qs}` : ""}`;
        return api.get<{ data: CustomerSummaryMetrics }>(url);
    },
};
