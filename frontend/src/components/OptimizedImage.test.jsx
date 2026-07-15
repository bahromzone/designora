import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import OptimizedImage from "./OptimizedImage";

describe("OptimizedImage", () => {
  it("reserves layout space and lazily decodes", () => {
    render(<OptimizedImage src="/course.webp" alt="Kurs" width={800} height={450} />);
    const image = screen.getByRole("img", { name: "Kurs" });
    expect(image).toHaveAttribute("width", "800");
    expect(image).toHaveAttribute("height", "450");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("decoding", "async");
  });

  it("requests modern responsive Unsplash variants", () => {
    render(<OptimizedImage src="https://images.unsplash.com/photo-test" alt="Preview" />);
    const image = screen.getByRole("img", { name: "Preview" });
    expect(image.src).toContain("auto=format");
    expect(image.getAttribute("srcset")).toContain("960w");
  });
});
