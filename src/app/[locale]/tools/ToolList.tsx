import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";

interface ToolLinkProps {
  title: string;
  description: string;
  href: string;
}

const ToolLink = ({ title, description, href }: ToolLinkProps) => {
  return (
    <Link
      href={href}
      className={`font-light font-['Helvetica Neue'] block py-6 px-10 hover:bg-branding-white`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-normal text-branding-black hover:underline">
            {title}
          </h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex-shrink-0 h-6 w-6">
          <ChevronRight className="h-full w-full text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
};

export const ToolList = ({ tools }) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-transparent overflow-hidden">
      {tools.map((tool, index) => (
        <div key={tool.href}>
          <ToolLink
            title={tool.title}
            description={tool.description}
            href={tool.href}
          />
          {index < tools.length - 1 && (
            <div className="h-px bg-gray-200 mx-6" />
          )}
        </div>
      ))}
    </div>
  );
};
