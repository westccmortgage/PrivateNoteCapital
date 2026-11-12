import { ImageResponse } from "next/og";

export const alt = "Private Note Capital: hard money loans for real estate investors";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0E3527",
          padding: "72px 80px",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
          Private Note&nbsp;<span style={{ color: "#FFC629" }}>Capital</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 82, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>Hard money loans for</div>
          <div style={{ fontSize: 82, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, color: "#FFC629" }}>
            real estate investors
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#C9D8CF" }}>
          Fix and flip, construction, bridge and rental loans from $50K to $3M.
        </div>
      </div>
    ),
    size,
  );
}
