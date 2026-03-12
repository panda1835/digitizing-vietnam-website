import { NextResponse } from "next/server";
import { getWorkBySlug, parseCorpusPage } from "@/app/[locale]/research/han-nom/search-database/_data/corpus";
import { isDvskttSlug, titles } from "@/app/[locale]/research/han-nom/search-database/_data/dvsktt-utils";

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = params;
        const { searchParams } = new URL(request.url);
        const page = searchParams.get("page");

        if (page) {
            const pageData = await parseCorpusPage(slug, parseInt(page), {
                book: searchParams.get("book"),
                topic: searchParams.get("topic")
            });
            if (!pageData) {
                return NextResponse.json({ error: "Page not found" }, { status: 404 });
            }
            return NextResponse.json(pageData);
        }

        const work = await getWorkBySlug(slug);
        if (!work) {
            return NextResponse.json({ error: "Work not found" }, { status: 404 });
        }

        // Include hierarchy for DVSKTT
        if (isDvskttSlug(slug)) {
            return NextResponse.json({ ...work, titles });
        }

        return NextResponse.json(work);
    } catch (error: any) {
        console.error("Corpus API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
