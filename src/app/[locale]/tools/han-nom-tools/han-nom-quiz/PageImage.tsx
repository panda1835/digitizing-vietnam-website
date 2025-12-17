import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { LucVanTienPageData, BookType } from "./types";

type PageImageProps = {
  locale: string;
  pageData: LucVanTienPageData | null;
  selectedPage: number;
  selectedBook: BookType;
};

export default function PageImage({
  locale,
  pageData,
  selectedPage,
  selectedBook,
}: PageImageProps) {
  // Determine the collection path based on the selected book
  const getCollectionPath = () => {
    if (selectedBook === "luc-van-tien") {
      return "van-tien-co-tich-tan-truyen";
    } else if (selectedBook.startsWith("truyen-kieu")) {
      const version = selectedBook.split("-")[2];
      return `truyen-kieu-${version}`;
    }
    return "";
  };

  const collectionPath = getCollectionPath();

  return (
    <div className="lg:w-1/3">
      <Card>
        <CardContent className="p-4">
          {pageData?.text?.page?.$ &&
          pageData.text.page.$.pi !== "NA" &&
          collectionPath ? (
            <Image
              src={`https://iiif.digitizingvietnam.com/iiif/2/${collectionPath}/${pageData.text.page.$.pi}/full/full/0/default.jpg`}
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
