import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        include: ["**/*.test.{ts,tsx}"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/",
                ".next/",
                "**/*.d.ts",
                "**/*.config.*",
                "**/types/**",
            ],
            thresholds: {
                statements: 100,
                branches: 100,
                functions: 100,
                lines: 100,
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
            "@shared": path.resolve(__dirname, "./src/shared"),
            "@features": path.resolve(__dirname, "./src/features"),
        },
    },
});
