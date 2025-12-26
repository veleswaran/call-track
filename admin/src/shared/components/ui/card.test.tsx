import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "./card";

describe("Card", () => {
    it("should render Card component", () => {
        render(<Card data-testid="card">Content</Card>);
        const card = screen.getByTestId("card");
        expect(card).toBeInTheDocument();
        expect(card).toHaveTextContent("Content");
    });

    it("should apply custom className to Card", () => {
        render(
            <Card data-testid="card" className="custom-card">
                Content
            </Card>
        );
        expect(screen.getByTestId("card")).toHaveClass("custom-card");
    });

    it("should forward ref to Card", () => {
        const ref = { current: null as HTMLDivElement | null };
        render(<Card ref={ref}>Content</Card>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
});

describe("CardHeader", () => {
    it("should render CardHeader component", () => {
        render(<CardHeader data-testid="header">Header</CardHeader>);
        const header = screen.getByTestId("header");
        expect(header).toBeInTheDocument();
    });

    it("should apply custom className to CardHeader", () => {
        render(
            <CardHeader data-testid="header" className="custom-header">
                Header
            </CardHeader>
        );
        expect(screen.getByTestId("header")).toHaveClass("custom-header");
    });

    it("should forward ref to CardHeader", () => {
        const ref = { current: null as HTMLDivElement | null };
        render(<CardHeader ref={ref}>Header</CardHeader>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
});

describe("CardTitle", () => {
    it("should render CardTitle component", () => {
        render(<CardTitle>Title</CardTitle>);
        const title = screen.getByRole("heading", { level: 3 });
        expect(title).toHaveTextContent("Title");
    });

    it("should apply custom className to CardTitle", () => {
        render(<CardTitle className="custom-title">Title</CardTitle>);
        const title = screen.getByRole("heading");
        expect(title).toHaveClass("custom-title");
    });

    it("should forward ref to CardTitle", () => {
        const ref = { current: null as HTMLHeadingElement | null };
        render(<CardTitle ref={ref}>Title</CardTitle>);
        expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
});

describe("CardDescription", () => {
    it("should render CardDescription component", () => {
        render(<CardDescription>Description text</CardDescription>);
        expect(screen.getByText("Description text")).toBeInTheDocument();
    });

    it("should apply custom className to CardDescription", () => {
        render(
            <CardDescription data-testid="desc" className="custom-desc">
                Description
            </CardDescription>
        );
        expect(screen.getByTestId("desc")).toHaveClass("custom-desc");
    });

    it("should forward ref to CardDescription", () => {
        const ref = { current: null as HTMLParagraphElement | null };
        render(<CardDescription ref={ref}>Description</CardDescription>);
        expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
});

describe("CardContent", () => {
    it("should render CardContent component", () => {
        render(<CardContent data-testid="content">Content here</CardContent>);
        expect(screen.getByTestId("content")).toHaveTextContent("Content here");
    });

    it("should apply custom className to CardContent", () => {
        render(
            <CardContent data-testid="content" className="custom-content">
                Content
            </CardContent>
        );
        expect(screen.getByTestId("content")).toHaveClass("custom-content");
    });

    it("should forward ref to CardContent", () => {
        const ref = { current: null as HTMLDivElement | null };
        render(<CardContent ref={ref}>Content</CardContent>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
});

describe("CardFooter", () => {
    it("should render CardFooter component", () => {
        render(<CardFooter data-testid="footer">Footer</CardFooter>);
        expect(screen.getByTestId("footer")).toHaveTextContent("Footer");
    });

    it("should apply custom className to CardFooter", () => {
        render(
            <CardFooter data-testid="footer" className="custom-footer">
                Footer
            </CardFooter>
        );
        expect(screen.getByTestId("footer")).toHaveClass("custom-footer");
    });

    it("should forward ref to CardFooter", () => {
        const ref = { current: null as HTMLDivElement | null };
        render(<CardFooter ref={ref}>Footer</CardFooter>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
});

describe("Card composition", () => {
    it("should render complete Card with all subcomponents", () => {
        render(
            <Card data-testid="card">
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card description text</CardDescription>
                </CardHeader>
                <CardContent>Main content here</CardContent>
                <CardFooter>Footer actions</CardFooter>
            </Card>
        );

        expect(screen.getByTestId("card")).toBeInTheDocument();
        expect(screen.getByRole("heading")).toHaveTextContent("Card Title");
        expect(screen.getByText("Card description text")).toBeInTheDocument();
        expect(screen.getByText("Main content here")).toBeInTheDocument();
        expect(screen.getByText("Footer actions")).toBeInTheDocument();
    });
});
