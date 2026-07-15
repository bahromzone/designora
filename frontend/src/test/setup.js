import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
afterEach(()=>cleanup());
const width=Number(process.env.VIEWPORT_WIDTH||1024);Object.defineProperty(window,"innerWidth",{writable:true,configurable:true,value:width});Object.defineProperty(window,"matchMedia",{writable:true,value:query=>({matches:/max-width:\s*900px/.test(query)?width<=900:false,media:query,onchange:null,addEventListener:()=>{},removeEventListener:()=>{},addListener:()=>{},removeListener:()=>{},dispatchEvent:()=>false})});window.scrollTo=vi.fn();
vi.mock("gsap",()=>{const tween={kill:()=>{}};const gsap={registerPlugin:()=>{},context:fn=>{if(typeof fn==="function")fn();return{revert:()=>{}}},fromTo:()=>tween,to:()=>tween,from:()=>tween,set:()=>{},timeline:()=>({to:()=>({}),from:()=>({}),fromTo:()=>({})})};return{default:gsap,gsap}});vi.mock("gsap/ScrollTrigger",()=>({ScrollTrigger:{create:()=>{},refresh:()=>{},kill:()=>{}}}));
