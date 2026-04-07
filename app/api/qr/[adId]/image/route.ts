import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

/**
 * GET /api/qr/[adId]/image
 * Generates a QR code PNG that points to the scan-tracking redirect endpoint.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  const { adId } = await params;

  // Build the redirect URL using the request's origin
  const origin = req.nextUrl.origin;
  const redirectUrl = `${origin}/api/qr/${adId}`;

  const buffer = await QRCode.toBuffer(redirectUrl, {
    type: "png",
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
