import localFont from "next/font/local";
import { Merriweather } from "next/font/google";
import Link from "@/components/nom-explorer/Link";
import "./explorer.css";

export const metadata = {
  title: {
    default: "Nôm Component Explorer | Digitizing Việt Nam",
    template: "%s | Digitizing Việt Nam",
  },
  description:
    "Look up a component to see every Nôm character built on it, the syllables it spells, variant spellings, Middle Chinese tone correspondences and dated attestation.",
};

const nom = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
  variable: "--font-nom",
  display: "swap",
});
const merriweather = Merriweather({
  weight: ["300", "400"],
  subsets: ["vietnamese", "latin"],
  variable: "--font-merriweather",
});

const SECTIONS = [
  ["/", "Search"],
  ["/insights", "Insights"],
  ["/variants", "Variants"],
  ["/review", "Review"],
  ["/sources", "Sources"],
  ["/guide", "Guide"],
];

export default function ExplorerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`nom-explorer ${nom.variable} ${merriweather.variable} flex flex-col items-center max-width`}>
      <div className="w-full mb-20">
        <nav aria-label="Explorer sections" className="flex flex-wrap gap-2 text-sm pt-6 mb-2">
          {SECTIONS.map(([href, label]) => (
            <Link key={href} href={href} className="px-3 py-1 rounded-full bg-white border border-primary-gray hover:border-branding-brown">
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
