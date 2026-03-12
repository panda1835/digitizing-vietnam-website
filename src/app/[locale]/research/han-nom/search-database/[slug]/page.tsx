import { getTranslations } from "next-intl/server";
import CorpusViewer from "@/app/[locale]/research/han-nom/search-database/_components/CorpusViewer";

export default async function CorpusWorkPage({
    params: { locale, slug }
}: {
    params: { locale: string; slug: string }
}) {
    return (
        <main className="min-h-screen bg-branding-gray/5">
            <CorpusViewer />
        </main>
    );
}
