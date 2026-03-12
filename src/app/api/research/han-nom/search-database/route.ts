import { NextResponse } from "next/server";
import { getCorpusRegistry, searchCorpus } from "@/app/[locale]/research/han-nom/search-database/_data/corpus";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (query) {
            const results = await searchCorpus(query);
            return NextResponse.json(results);
        }

        const registry = await getCorpusRegistry();
        return NextResponse.json(registry);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
