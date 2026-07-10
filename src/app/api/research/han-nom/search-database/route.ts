import { NextResponse } from "next/server";
import { getCorpusRegistry, searchCorpus } from "@/app/[locale]/research/han-nom/search-database/_data/corpus";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (query) {
            // includeWiki defaults to true (opt-out); only an explicit "0"/"false" disables OCR results.
            const includeWikiParam = searchParams.get("includeWiki");
            const includeWiki = !(includeWikiParam === "0" || includeWikiParam === "false");
            const results = await searchCorpus(query, { includeWiki });
            return NextResponse.json(results);
        }

        const registry = await getCorpusRegistry();
        return NextResponse.json(registry);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
