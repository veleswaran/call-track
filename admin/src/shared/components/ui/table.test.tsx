import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./table";

describe("Table", () => {
    it("renders table structure correctly", () => {
        render(
            <Table>
                <TableCaption>A list of invoices.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>INV001</TableCell>
                        <TableCell>Paid</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );

        expect(screen.getByText("A list of invoices.")).toBeInTheDocument();
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByText("Invoice")).toBeInTheDocument();
        expect(screen.getByText("INV001")).toBeInTheDocument();
    });
});
