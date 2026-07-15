import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Input from "../components/ui/Input";
import Tabs from "../components/ui/Tabs";
import VideoPlayer from "../components/VideoPlayer";

describe("WCAG 2.2 component contracts", () => {
  it("associates labels, hints and assertive errors", () => {
    render(<Input id="email" label="Email" hint="Ish emailingiz" error="Email noto‘g‘ri" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "email-hint email-error");
    expect(screen.getByRole("alert")).toHaveTextContent("Email noto‘g‘ri");
  });

  it("creates a stable generated id when no id or name exists", () => {
    render(<Input label="Ism" />);
    expect(screen.getByLabelText("Ism").id).not.toBe("");
  });

  it("supports arrows, Home and End with roving focus", () => {
    const onChange = vi.fn();
    render(<Tabs value="a" onChange={onChange} tabs={[{ value: "a", label: "A" }, { value: "b", label: "B" }, { value: "c", label: "C" }]} />);
    const first = screen.getByRole("tab", { name: "A" });
    const last = screen.getByRole("tab", { name: "C" });
    expect(first).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(first, { key: "End" });
    expect(last).toHaveFocus();
    expect(onChange).toHaveBeenCalledWith("c");
    fireEvent.keyDown(last, { key: "ArrowRight" });
    expect(first).toHaveFocus();
  });

  it("publishes tab relationships and selected state", () => {
    render(<Tabs value="b" tabs={[{ value: "a", label: "A" }, { value: "b", label: "B" }]} />);
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-controls", "panel-b");
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
  });

  it("exposes transcript expansion and pressed speed state", () => {
    render(<VideoPlayer src="/lesson.mp4" transcript="Dars matni" />);
    expect(screen.getByText("Transkriptni ochish")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "1x" })).toHaveAttribute("aria-pressed", "true");
  });
});
