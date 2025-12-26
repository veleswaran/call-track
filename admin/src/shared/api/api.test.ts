import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, type ApiError } from "./api";

describe("api client", () => {
    const mockFetch = vi.fn();
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = mockFetch;
        mockFetch.mockReset();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    describe("baseUrl", () => {
        it("should have the correct base URL", () => {
            expect(api.baseUrl).toBe("http://localhost:8000");
        });
    });

    describe("getCsrfCookie", () => {
        it("should fetch CSRF cookie with credentials", async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            await api.getCsrfCookie();

            expect(mockFetch).toHaveBeenCalledWith(
                "http://localhost:8000/sanctum/csrf-cookie",
                { credentials: "include" }
            );
        });
    });

    describe("get", () => {
        it("should make GET request with correct headers", async () => {
            const mockData = { id: 1, name: "Test" };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const result = await api.get("/api/v1/test");

            expect(mockFetch).toHaveBeenCalledWith("http://localhost:8000/api/v1/test", {
                credentials: "include",
                headers: { Accept: "application/json" },
            });
            expect(result).toEqual(mockData);
        });

        it("should throw error on non-ok response", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: "Not Found",
            });

            try {
                await api.get("/api/v1/test");
                expect.fail("Expected error to be thrown");
            } catch (error) {
                expect((error as ApiError).message).toBe("Not Found");
                expect((error as ApiError).status).toBe(404);
            }
        });
    });

    describe("post", () => {
        it("should fetch CSRF cookie before POST", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true }) // CSRF
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                });

            await api.post("/api/v1/test", { data: "value" });

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(mockFetch).toHaveBeenNthCalledWith(
                1,
                "http://localhost:8000/sanctum/csrf-cookie",
                { credentials: "include" }
            );
        });

        it("should make POST request with JSON body", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true }) // CSRF
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: 1 }),
                });

            const result = await api.post("/api/v1/test", { name: "Test" });

            expect(mockFetch).toHaveBeenNthCalledWith(
                2,
                "http://localhost:8000/api/v1/test",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name: "Test" }),
                }
            );
            expect(result).toEqual({ id: 1 });
        });

        it("should handle POST without body", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true }) // CSRF
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                });

            await api.post("/api/v1/logout");

            expect(mockFetch).toHaveBeenNthCalledWith(
                2,
                "http://localhost:8000/api/v1/logout",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: undefined,
                }
            );
        });

        it("should throw error on non-ok response", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true }) // CSRF
                .mockResolvedValueOnce({
                    ok: false,
                    status: 422,
                    statusText: "Unprocessable Entity",
                });

            await expect(api.post("/api/v1/test", {})).rejects.toThrow(
                "Unprocessable Entity"
            );
        });
    });

    describe("put", () => {
        it("should fetch CSRF cookie before PUT", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true }) // CSRF
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                });

            await api.put("/api/v1/test/1", { name: "Updated" });

            expect(mockFetch).toHaveBeenNthCalledWith(
                1,
                "http://localhost:8000/sanctum/csrf-cookie",
                { credentials: "include" }
            );
        });

        it("should make PUT request with JSON body", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true }) // CSRF
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: 1, name: "Updated" }),
                });

            const result = await api.put("/api/v1/test/1", { name: "Updated" });

            expect(mockFetch).toHaveBeenNthCalledWith(
                2,
                "http://localhost:8000/api/v1/test/1",
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name: "Updated" }),
                }
            );
            expect(result).toEqual({ id: 1, name: "Updated" });
        });

        it("should handle PUT without body", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true }) // CSRF
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                });

            await api.put("/api/v1/test/1");

            expect(mockFetch).toHaveBeenNthCalledWith(
                2,
                "http://localhost:8000/api/v1/test/1",
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: undefined,
                }
            );
        });

        it("should throw error on non-ok response", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true }) // CSRF
                .mockResolvedValueOnce({
                    ok: false,
                    status: 404,
                    statusText: "Not Found",
                });

            await expect(api.put("/api/v1/test/999", {})).rejects.toThrow("Not Found");
        });
    });

    describe("delete", () => {
        it("should fetch CSRF cookie before DELETE", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true }) // CSRF
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                });

            await api.delete("/api/v1/test/1");

            expect(mockFetch).toHaveBeenNthCalledWith(
                1,
                "http://localhost:8000/sanctum/csrf-cookie",
                { credentials: "include" }
            );
        });

        it("should make DELETE request", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true }) // CSRF
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ deleted: true }),
                });

            const result = await api.delete("/api/v1/test/1");

            expect(mockFetch).toHaveBeenNthCalledWith(
                2,
                "http://localhost:8000/api/v1/test/1",
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: { Accept: "application/json" },
                }
            );
            expect(result).toEqual({ deleted: true });
        });

        it("should throw error on non-ok response", async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true }) // CSRF
                .mockResolvedValueOnce({
                    ok: false,
                    status: 403,
                    statusText: "Forbidden",
                });

            await expect(api.delete("/api/v1/test/1")).rejects.toThrow("Forbidden");
        });
    });
});
