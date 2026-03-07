import { getTranslations } from "next-intl/server";
import CorpusBrowser from "@/app/[locale]/research/han-nom/search-database/_components/CorpusBrowser";

export default async function CorpusPage({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations("ResearchHub.HanNomHub.scholar-workshop.toolbox");

    return (
        <main className="min-h-screen bg-branding-gray/5">
            <CorpusBrowser />
        </main>
    );
}
