import { describe, it, expect } from "vitest";
import { createQueryClient } from "./query-client";

describe("createQueryClient", () => {
    it("should create a QueryClient instance", () => {
        const client = createQueryClient();
        expect(client).toBeDefined();
    });

    it("should have correct default query options", () => {
        const client = createQueryClient();
        const defaultOptions = client.getDefaultOptions();

        expect(defaultOptions.queries?.staleTime).toBe(60 * 1000);
        expect(defaultOptions.queries?.retry).toBe(3);
        expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    });

    it("should have correct default mutation options", () => {
        const client = createQueryClient();
        const defaultOptions = client.getDefaultOptions();

        expect(defaultOptions.mutations?.retry).toBe(1);
    });

    it("should create independent instances", () => {
        const client1 = createQueryClient();
        const client2 = createQueryClient();

        expect(client1).not.toBe(client2);
    });
});
