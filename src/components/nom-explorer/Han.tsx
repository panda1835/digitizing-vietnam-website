import Link from "@/components/nom-explorer/Link";

// A character that links to its own component page.
export function HanLink({ ch, className = "" }: { ch: string; className?: string }) {
  return (
    <Link href={`/component/${encodeURIComponent(ch)}`} className={`han hover:text-branding-brown ${className}`}>
      {ch}
    </Link>
  );
}
