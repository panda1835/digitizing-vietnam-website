import HanNomEditor from "./HanNomInputEditor";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: `${t(
      "Tools.han-nom-tools.tools.han-nom-input-method-editor.name"
    )} | Digitizing Việt Nam`,
    description: t(
      "Tools.han-nom-tools.tools.han-nom-input-method-editor.description"
    ),
  };
}
export default function HanNomInputMethod() {
  return (
    <div>
      <HanNomEditor />
    </div>
  );
}
