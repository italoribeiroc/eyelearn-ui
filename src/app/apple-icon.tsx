import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <svg width="150" height="150" viewBox="0 -2 48 48" fill="none">
          <defs>
            <linearGradient id="eyelearn-mark" x1="4" y1="8" x2="44" y2="40">
              <stop offset="0" stopColor="#0fa9a6" />
              <stop offset="1" stopColor="#3adcb0" />
            </linearGradient>
          </defs>
          <path
            d="M24 12c9.5 0 16.8 6.1 20 12-3.2 5.9-10.5 12-20 12S7.2 29.9 4 24c3.2-5.9 10.5-12 20-12Z"
            fill="url(#eyelearn-mark)"
          />
          <rect x="16.5" y="17" width="15" height="14" rx="4" fill="#ffffff" />
          <rect x="19.5" y="20.4" width="9" height="1.8" rx="0.9" fill="#0fa9a6" />
          <rect x="19.5" y="24" width="6" height="1.8" rx="0.9" fill="#ff7a45" />
          <circle cx="38.5" cy="10.5" r="2.5" fill="#ff7a45" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
