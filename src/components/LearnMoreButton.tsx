import { Link } from "@/i18n/routing";
import { MoveRight } from "lucide-react";
export default function LearnMoreButton({
  url,
  text = "Learn more",
  className = "",
}) {
  return (
    <div>
      <Link href={url} target="_blank" rel="noopener noreferrer">
        <div
          className={[
            "h-[22px] justify-start items-center gap-2 inline-flex text-branding-brown text-base font-normal",
            className,
          ].join(" ")}
        >
          <div className="font-['Helvetica Neue']">{text}</div>
          <MoveRight size={16} />
        </div>
      </Link>
    </div>
  );
}
