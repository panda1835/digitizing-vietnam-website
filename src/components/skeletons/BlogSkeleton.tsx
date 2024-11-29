import { useTranslations } from "next-intl";

import ItemSleleton from "@/components/skeletons/ItemSkeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const BlogSkeleton = () => {
  const t = useTranslations();
  return (
    <div className="flex flex-col max-width">
      <div className="flex-col mb-20 mx-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{t("Header.home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>{t("Header.blogs")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Header */}
        <section className="flex-col text-center my-8">
          <h1>{t("Blog.title")}</h1>
          <p className="text-gray-500">{t("Blog.subtitle")}</p>
        </section>

        {/* News */}
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {[1, 2, 3].map((item) => (
              <ItemSleleton key={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BlogSkeleton;
