import { ReactNode } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

type Props = {
  children: ReactNode;
};

// Since we have a `not-found.tsx` page on the root, a layout file
// is required, even if it's just passing children through.
export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <body>{children}</body>
      <GoogleAnalytics gaId="G-05TY9EP7K7" />
    </html>
  );
}
