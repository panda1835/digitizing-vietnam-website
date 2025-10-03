import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { LucVanTienPageData } from "./types";

type PageImageProps = {
  locale: string;
  pageData: LucVanTienPageData | null;
  selectedPage: number;
};

export default function PageImage({
  locale,
  pageData,
  selectedPage,
}: PageImageProps) {
  return (
    <div className="lg:w-1/3">
      <Card>
        <CardContent className="p-4">
          {pageData?.text?.page?.$ && pageData.text.page.$.pi !== "NA" ? (
            <Image
              src={`https://iiif.digitizingvietnam.com/iiif/2/van-tien-co-tich-tan-truyen/${pageData.text.page.$.pi}/full/full/0/default.jpg`}
              alt={`Page ${selectedPage}`}
              width={400}
              height={600}
              className="w-full rounded"
              unoptimized
            />
          ) : (
            <div className="w-full h-96 flex items-center justify-center bg-gray-200 rounded">
              {locale === "vi" ? "Không có hình ảnh" : "No image available"}
            </div>
          )}
          <div className="text-center text-sm mt-2 text-gray-600">
            {locale === "vi" ? "Trang" : "Page"} {selectedPage}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
