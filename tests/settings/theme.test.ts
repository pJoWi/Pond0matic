import { describe, it, expect } from "vitest";
import { resolveThemeIsDark } from "@/lib/settings/theme";

describe("resolveThemeIsDark", () => {
  it("ignores OS preference before ready (SSR + first client render must match)", () => {
    // The server has no window/matchMedia; a "system" theme must resolve the
    // SAME on the server and on the client's first render, i.e. NOT dark —
    // otherwise React throws a hydration mismatch.
    expect(resolveThemeIsDark("system", false, true)).toBe(false);
    expect(resolveThemeIsDark("light", false, true)).toBe(false);
    // an explicit "dark" is deterministic and safe to render on the server
    expect(resolveThemeIsDark("dark", false, false)).toBe(true);
  });

  it("honors explicit theme and the OS preference once ready (after mount)", () => {
    expect(resolveThemeIsDark("dark", true, false)).toBe(true);
    expect(resolveThemeIsDark("light", true, true)).toBe(false);
    expect(resolveThemeIsDark("system", true, true)).toBe(true);
    expect(resolveThemeIsDark("system", true, false)).toBe(false);
  });
});
