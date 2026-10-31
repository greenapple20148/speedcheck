import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo/metadata";

export const runtime = "edge";
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background: "#F8FAF9",
          color: "#142F2A",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#16856D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 56, fontWeight: 700 }}>{SITE_NAME}</div>
        </div>
        <div style={{ fontSize: 36, fontWeight: 500, color: "#647872", maxWidth: 900 }}>
          Measure download, upload, ping, and jitter with real network transfers.
        </div>
      </div>
    ),
    { ...size },
  );
}
