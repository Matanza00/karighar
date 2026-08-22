import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Generated app icon: white "K" on the KARIGHAR brand green.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f766e",
          color: "white",
          fontSize: 320,
          fontWeight: 800,
        }}
      >
        K
      </div>
    ),
    size
  );
}
