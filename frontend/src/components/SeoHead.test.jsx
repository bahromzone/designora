import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SeoHead, { getCanonicalUrl } from "./SeoHead";

describe("SeoHead", () => {
  it("sets canonical, Open Graph, robots and JSON-LD", () => {
    render(
      <SeoHead
        title="UI kursi"
        description="Amaliy UI kursi"
        path="/kurslar/7/?utm_source=test"
        structuredData={{ "@context": "https://schema.org", "@type": "Course", name: "UI kursi" }}
      />
    );
    expect(document.title).toContain("UI kursi");
    expect(document.querySelector('link[rel="canonical"]').href).toBe(getCanonicalUrl("/kurslar/7"));
    expect(document.querySelector('meta[property="og:image"]').content).toContain("og-default.svg");
    expect(document.querySelector('meta[name="robots"]').content).toContain("index");
    expect(JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)["@type"]).toBe("Course");
  });
});
