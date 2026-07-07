import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import Rating from "../components/ui/Rating";

describe("Button", () => {
  it("renders children and fires onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Bosing</Button>);
    const btn = screen.getByRole("button", { name: "Bosing" });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled while loading", () => {
    render(<Button loading>Yuborish</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("Input", () => {
  it("shows label and error", () => {
    render(<Input name="email" label="Email" error="Xato" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Xato")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });
});

describe("Badge", () => {
  it("renders content", () => {
    render(<Badge tone="success">Faol</Badge>);
    expect(screen.getByText("Faol")).toBeInTheDocument();
  });
});

describe("Rating", () => {
  it("renders five stars and fires onChange when interactive", () => {
    const onChange = vi.fn();
    render(<Rating value={3} onChange={onChange} />);
    const stars = screen.getAllByRole("button");
    expect(stars).toHaveLength(5);
    fireEvent.click(stars[4]);
    expect(onChange).toHaveBeenCalledWith(5);
  });
});

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="Bo'sh" description="Hech narsa yo'q" />);
    expect(screen.getByText("Bo'sh")).toBeInTheDocument();
    expect(screen.getByText("Hech narsa yo'q")).toBeInTheDocument();
  });
});

describe("Pagination", () => {
  it("hides when a single page", () => {
    const { container } = render(
      <Pagination page={1} pages={1} onChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("navigates to the next page", () => {
    const onChange = vi.fn();
    render(<Pagination page={1} pages={3} onChange={onChange} />);
    fireEvent.click(screen.getByText(/Keyingi/));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
