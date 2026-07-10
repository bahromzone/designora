import {expect,it} from "vitest";
import {calendarRange,groupEvents} from "./calendarLogic";
it("builds day week and month ranges",()=>{expect(calendarRange("2026-07-10T12:00:00Z","day").end.getDate()).toBe(11);expect(calendarRange("2026-07-10T12:00:00Z","week").start.getDay()).toBe(1);expect(calendarRange("2026-07-10T12:00:00Z","month").start.getDate()).toBe(1);});
it("groups events by local date",()=>{const groups=groupEvents([{starts_at:"2026-07-10T09:00:00+05:00"},{starts_at:"2026-07-10T11:00:00+05:00"}]);expect(groups["2026-07-10"]).toHaveLength(2);});
