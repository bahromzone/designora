import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ pending: vi.fn(), remove: vi.fn() }));
vi.mock("../lib/offlineStore", () => ({
  offlineStore: { pending: mocks.pending, remove: mocks.remove },
}));
import { registerOfflineSync, syncOffline } from "../lib/offlineSync";

describe("offline recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });

  it("skips network when queue is empty", async () => {
    mocks.pending.mockResolvedValue([]);
    global.fetch = vi.fn();
    expect(await syncOffline("t")).toEqual({ synced: 0, conflicts: 0, results: [] });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("removes applied and duplicate mutations but keeps conflicts", async () => {
    mocks.pending.mockResolvedValue([{ client_id: "a" }, { client_id: "b" }, { client_id: "c" }]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        synced: 2,
        conflicts: 1,
        results: [
          { client_id: "a", status: "applied" },
          { client_id: "b", duplicate: true },
          { client_id: "c", status: "conflict" },
        ],
      }),
    });
    const result = await syncOffline("token");
    expect(result).toMatchObject({ synced: 2, conflicts: 1 });
    expect(mocks.remove).toHaveBeenCalledWith("a");
    expect(mocks.remove).toHaveBeenCalledWith("b");
    expect(mocks.remove).not.toHaveBeenCalledWith("c");
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer token");
  });

  it("preserves queue and reports a server failure", async () => {
    mocks.pending.mockResolvedValue([{ client_id: "a" }]);
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    await expect(syncOffline("t")).rejects.toThrow("Offline sync bajarilmadi");
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("waits for the online event and unregisters cleanly", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    mocks.pending.mockResolvedValue([]);
    const onResult = vi.fn();
    const stop = registerOfflineSync("t", onResult);
    expect(mocks.pending).not.toHaveBeenCalled();
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    window.dispatchEvent(new Event("online"));
    await vi.waitFor(() => expect(onResult).toHaveBeenCalled());
    stop();
  });
});
