import PageHeader from "@/components/nom-explorer/PageHeader";
import ReviewTable from "@/components/nom-explorer/ReviewTable";
import ReviewIntro from "@/components/nom-explorer/ReviewIntro";
import { onsetReviewItems, reviewItems } from "@/lib/nom-explorer/data";

export const metadata = { title: "Review · Nôm Component Explorer" };

// Local version: read-only. Choices are saved in the shared (artifact) version.
export default function ReviewPage({ searchParams }: { searchParams: { kind?: string } }) {
  return (
    <div>
      <PageHeader crumbs={[{ label: "Review" }]} title="Review inferred phonetics" subtitle={<ReviewIntro />} />
      <ReviewTable
        items={[...reviewItems(), ...onsetReviewItems()]}
        decisions={{}}
        initialKind={searchParams.kind === "onset" ? "onset" : "phonetic"}
        status="Read-only on the site: this list shows where the explorer inferred a role."
      />
    </div>
  );
}
