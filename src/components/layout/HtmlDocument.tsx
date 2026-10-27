import { ReactNode } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

export default function HtmlDocument({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  return (
    <html lang={locale}>
      <body>
        {children}
        <GoogleAnalytics gaId="G-05TY9EP7K7" />
      </body>
    </html>
  );
}
