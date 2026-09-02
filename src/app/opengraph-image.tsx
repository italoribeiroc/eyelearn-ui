import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Eye Learn";

// Static and locale-agnostic, same choice apple-icon.tsx makes: one image
// for both locales sidesteps next/og's custom-font-loading requirement
// entirely (no tagline text that would need to be either English-only, or
// a second dynamic locale-aware route -- real complexity not justified for
// a single share-preview image). Mark artwork is a verbatim, scaled-up
// reuse of apple-icon.tsx's SVG paths so the brand mark is pixel-consistent
// across favicon, apple touch icon, and this OG image.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 96px",
          background: "linear-gradient(135deg, #0fa9a6 0%, #3adcb0 100%)",
        }}
      >
        <svg width="260" height="260" viewBox="0 -2 48 48" fill="none" style={{ flexShrink: 0 }}>
          <path
            d="M24 12c9.5 0 16.8 6.1 20 12-3.2 5.9-10.5 12-20 12S7.2 29.9 4 24c3.2-5.9 10.5-12 20-12Z"
            fill="#ffffff"
          />
          <rect x="16.5" y="17" width="15" height="14" rx="4" fill="#0fa9a6" />
          <rect x="19.5" y="20.4" width="9" height="1.8" rx="0.9" fill="#ffffff" />
          <rect x="19.5" y="24" width="6" height="1.8" rx="0.9" fill="#ff7a45" />
          <circle cx="38.5" cy="10.5" r="2.5" fill="#ff7a45" />
        </svg>
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            fontFamily: "sans-serif",
            color: "#ffffff",
          }}
        >
          Eye Learn
        </div>
      </div>
    ),
    { ...size },
  );
}
