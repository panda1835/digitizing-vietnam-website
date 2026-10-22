import Link from "@/components/nom-explorer/Link";
import { Link as SiteLink } from "@/i18n/routing";

export default function PageHeader({
  title,
  subtitle,
  crumbs = [],
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  crumbs?: { label: string; href?: string }[];
}) {
  return (
    <div className="mb-8">
      {(
        <div className="text-sm text-[var(--ink-3)] mb-4 flex gap-2 flex-wrap">
          <SiteLink href="/tools" className="hover:text-branding-brown">Tools</SiteLink>
          <span>/</span>
          <SiteLink href="/tools/han-nom-tools" className="hover:text-branding-brown">Hán-Nôm Tools</SiteLink>
          <span>/</span>
          <Link href="/" className="hover:text-branding-brown">Nôm Component Explorer</Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex gap-2">
              <span>/</span>
              {c.href ? <Link href={c.href} className="hover:text-branding-brown">{c.label}</Link> : <span className="text-branding-black">{c.label}</span>}
            </span>
          ))}
        </div>
      )}
      <h1 className={`font-heading text-[32px] leading-tight text-branding-black`}>{title}</h1>
      {subtitle && <div className="mt-3 text-base text-[var(--ink)] max-w-3xl">{subtitle}</div>}
      <div className="mt-8 h-px bg-primary-gray" />
    </div>
  );
}

export function SectionTitle({ id, children, note }: { id?: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-6 mb-4">
      <h2 className={`font-heading text-2xl text-[var(--brown-ink)]`}>{children}</h2>
      {note && <p className="text-sm text-[var(--ink-2)] mt-1 max-w-3xl">{note}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-primary-gray p-5 ${className}`}>{children}</div>;
}

export function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-primary-gray px-4 py-3">
      <div className="text-2xl text-branding-black tabular-nums">{value}</div>
      <div className="text-xs text-[var(--ink-3)] mt-0.5">{label}</div>
    </div>
  );
}
