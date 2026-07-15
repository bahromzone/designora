import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Input from "../components/ui/Input";
import Tabs from "../components/ui/Tabs";
import VideoPlayer from "../components/VideoPlayer";

describe("WCAG component contracts",()=>{
 it("associates labels, hints and errors",()=>{render(<Input name="email" label="Email" hint="Ishchi emailingiz" error="Email noto‘g‘ri"/>);const input=screen.getByLabelText("Email");expect(input).toHaveAttribute("aria-invalid","true");expect(input.getAttribute("aria-describedby")).toContain("email-error")});
 it("supports arrow-key tab navigation",()=>{const onChange=vi.fn();render(<Tabs tabs={[{value:"a",label:"A"},{value:"b",label:"B"}]} value="a" onChange={onChange}/>);fireEvent.keyDown(screen.getByRole("tab",{name:"A"}),{key:"ArrowRight"});expect(onChange).toHaveBeenCalledWith("b")});
 it("exposes captions, transcript and pressed speed state",()=>{render(<VideoPlayer src="/video.mp4" subtitles={[{src:"/uz.vtt",srclang:"uz",label:"O‘zbekcha"}]} transcript="Salom"/>);expect(screen.getByText("Transkriptni ochish")).toHaveAttribute("aria-expanded","false");expect(screen.getByRole("button",{name:"1x"})).toHaveAttribute("aria-pressed","true")});
});
