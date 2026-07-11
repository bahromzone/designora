import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar";

vi.mock("../context/AuthContext",()=>({useAuth:()=>({isAuthenticated:false,user:null,logout:vi.fn()})}));
const widths=[320,375,430,768,1024,1366,1920];
describe.each(widths)("responsive viewport %ipx",width=>{it("keeps navigation accessible and drawer operable",()=>{Object.defineProperty(window,"innerWidth",{writable:true,configurable:true,value:width});window.dispatchEvent(new Event("resize"));render(<MemoryRouter><Navbar/></MemoryRouter>);const toggle=screen.getByRole("button",{name:"Menyuni ochish"});expect(toggle).toHaveAttribute("aria-expanded","false");fireEvent.click(toggle);expect(toggle).toHaveAttribute("aria-expanded","true");expect(screen.getByRole("navigation",{name:"Mobil navigatsiya"})).toBeInTheDocument()})});
