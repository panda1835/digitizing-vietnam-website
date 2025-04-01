import { Link } from "@/i18n/routing";
import { MoveRight } from "lucide-react";

export default function LearnMoreButton({
  url,
  text = "Learn more",
  className = "",
  newTab = true,
}) {
  return (
    <div>
      <Link
        href={url}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
      >
        <div
          className={[
            "h-[22px] justify-start items-center gap-2 inline-flex text-branding-brown text-base font-normal",
            className,
          ].join(" ")}
        >
          <div className="font-['Helvetica Neue'] font-light">{text}</div>
          <MoveRight size={16} />
        </div>
      </Link>
    </div>
  );
}
