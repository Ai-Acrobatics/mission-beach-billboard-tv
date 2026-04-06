import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Player — Mission Beach Billboard TV",
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
