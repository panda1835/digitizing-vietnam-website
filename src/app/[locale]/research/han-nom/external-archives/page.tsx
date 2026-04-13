import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Merriweather } from "next/font/google";

import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/common/PageHeader";
import { Separator } from "@/components/ui/separator";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("ExternalArchives.title")} | Digitizing Việt Nam`,
  };
}

export default async function ExternalArchivesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const isVi = locale === "vi";

  const onlineArchives = [
    {
      name: isVi
        ? "Bảo tàng Mở Hán Nôm (Đài Loan)"
        : "Hán-Nôm Open Museum (Taiwan)",
      description: isVi
        ? "Bộ sưu tập kỹ thuật số các tài liệu Hán-Nôm từ Bảo tàng Mở của Đài Loan, bao gồm các văn bản lịch sử và nghệ thuật."
        : "Digital catalog of Hán-Nôm materials from Taiwan's Open Museum.",
      url: "https://hannom.openmuseum.tw/",
    },
    {
      name: "Vietnamica",
      description: isVi
        ? "Cơ sở dữ liệu bản đồ này chứa 20.980 bản dập văn bia được Trường Viễn Đông Bác cổ Pháp thực hiện tại Việt Nam từ năm 1910 đến năm 1944. Một chương trình ERC của École Pratique des Hautes Études."
        : "This cartographic database contains the 20,980 rubbings of steles produced in Vietnam by the École Française d'Extrême-Orient between 1910 and 1944. An ERC program of the École Pratique des Hautes Études.",
      url: "https://carto.vietnamica.online/?language=en",
    },
    {
      name: isVi ? "Bộ sưu tập Vatican" : "Vatican Library Collection",
      description: isVi
        ? "Bộ sưu tập các nguồn tài liệu từ Việt Nam tại Vatican, bao gồm cả chữ Quốc ngữ và Hán Việt."
        : "Vatican collection of sources from Vietnam, both Quốc ngữ and Hán Việt.",
      url: "https://digi.vatlib.it/mss/Borg.tonch",
    },
    {
      name: "Yale Maurice Durand",
      description: isVi
        ? "Bộ sưu tập Maurice Durand về Hán-Nôm tại Đại học Yale."
        : "Maurice Durand collection of Hán-Nôm materials at Yale University.",
      url: "https://web.library.yale.edu/digital-collections/han-nom",
    },
    {
      name: isVi ? "Thư viện Anh" : "British Library",
      description: isVi
        ? "Chương trình Lưu trữ Bị đe dọa (EAP) của Thư viện Anh: Các bộ sưu tập kỹ thuật số từ Việt Nam."
        : "British Library Endangered Archives Programme (EAP): Digital collections from Vietnam.",
      url: "https://eap.bl.uk/collection/EAP219-1/search",
    },
    {
      name: "Temple University - Vietnam Nôm Manuscripts Project",
      description: isVi
        ? "Dự án số hóa thực địa các bản thảo Nôm Việt Nam của Đại học Temple."
        : "Vietnam Nôm Manuscripts Field Digitization Project by Temple University.",
      url: "https://digital.library.temple.edu/digital/collection/p16002coll24",
    },
    {
      name: isVi
        ? "Nguồn Hán-Nôm trên Internet Archive"
        : "Hán-Nôm Sources on Internet Archive",
      description: isVi
        ? "Các tài liệu Hán-Nôm được lưu trữ trên Internet Archive."
        : "Hán-Nôm documents and manuscripts preserved on the Internet Archive.",
      url: "https://archive.org/search?query=subject%3A%22ch%E1%BB%AF+N%C3%B4m%22",
    },
  ];

  const physicalArchives = [
    {
      name: "BULAC",
      description: isVi
        ? "Thư viện Đại học về Ngôn ngữ và Văn minh: Danh mục nghiên cứu toàn diện cho các bộ sưu tập tiếng Việt và Hán-Nôm phong phú tại Pháp."
        : "Bibliothèque universitaire des langues et civilisations: Comprehensive research catalog for extensive Vietnamese and Hán-Nôm collections in France.",
      url: "https://www.bulac.fr/",
    },
    {
      name: isVi ? "Viện Nghiên cứu Hán-Nôm" : "Institute of Sino-Nôm Studies",
      description: isVi
        ? "Các danh mục thẻ và hồ sơ thư mục đã được số hóa từ Viện Nghiên cứu Hán-Nôm tại Hà Nội."
        : "Digitized card catalogs and bibliographic records from the Institute of Sino-Nôm Studies in Hanoi.",
    },
    {
      name: isVi ? "Thư viện Quốc gia Việt Nam" : "National Library of Vietnam",
      description: isVi
        ? "Tìm kiếm bộ sưu tập kỹ thuật số của Thư viện Quốc gia Việt Nam, bao gồm kho lưu trữ Hán-Nôm quan trọng."
        : "Search the digital collection of the National Library of Vietnam, including a significant Hán-Nôm repository.",
      url: "http://nlv.gov.vn/",
    },
    {
      name: isVi
        ? "Thư viện Khoa học Tổng hợp TP.HCM"
        : "Ho Chi Minh City General Sciences Library",
      description: isVi
        ? "Bộ sưu tập tài liệu Hán-Nôm được số hóa từ Thư viện Khoa học Tổng hợp TP.HCM."
        : "Catalog of Hán-Nôm holdings from the Ho Chi Minh City General Sciences Library.",
      url: "https://phucvu.thuvientphcm.gov.vn/item/SearchAdvanced?CollectionId=1140",
    },
    {
      name: "EFEO (École française d'Extrême-Orient)",
      description: isVi
        ? "Kho lưu trữ kỹ thuật số và danh mục thư viện từ Trường Viễn Đông Bác cổ Pháp."
        : "Digital archives and library catalogs from the French School of the Far East.",
      url: "https://www.efeo.fr/",
    },
    {
      name: isVi
        ? "Trung tâm Lưu trữ quốc gia I, Hà Nội"
        : "National Archives Center I, Hanoi",
      description: isVi
        ? "Lưu giữ các hồ sơ hành chính quan trọng từ triều Nguyễn và thời kỳ Pháp thuộc."
        : "Houses significant administrative records from the Nguyễn Dynasty and French Colonial period.",
      url: "https://archives.org.vn/",
    },
    {
      name: isVi
        ? "Mộc bản triều Nguyễn (Trung tâm Lưu trữ quốc gia IV)"
        : "Nguyen Dynasty Royal Woodblocks (National Archives Center IV)",
      description: isVi
        ? "Nơi lưu giữ Mộc bản triều Nguyễn, Di sản tư liệu thế giới của UNESCO, cùng nhiều tài liệu hành chính và lịch sử quý hiếm khác."
        : "Home to the Nguyen Dynasty Woodblocks, a UNESCO World Documentary Heritage, and other rare administrative and historical documents.",
      url: "https://mocban.vn/en/home/",
    },
  ];

  const ResourceList = ({
    items,
  }: {
    items: { name: string; description: string; url?: string }[];
  }) => (
    <div className="mt-8">
      {items.map((resource) => (
        <div key={resource.name} className="mb-8">
          <div
            className={`${merriweather.className} text-branding-black text-2xl leading-relaxed`}
          >
            {resource.url ? (
              <Link
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-branding-brown"
              >
                {resource.name}
              </Link>
            ) : (
              resource.name
            )}
          </div>
          <p className="text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed mt-2">
            {resource.description}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("ExternalArchives.title")}
          subtitle=""
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "/research" },
            {
              label: t("ResearchHub.HanNomHub.hero.title"),
              href: "/research/han-nom",
            },
            { label: t("ExternalArchives.title") },
          ]}
          locale={locale}
        />

        <main className="mt-10">
          <section>
            <h2
              className={`${merriweather.className} text-[28px] text-branding-brown `}
            >
              {t("ExternalArchives.online-archives.title")}
            </h2>
            <p className="font-['Helvetica Neue'] font-light text-base text-branding-black mt-4">
              {t("ExternalArchives.online-archives.description")}
            </p>
            <ResourceList items={onlineArchives} />
          </section>

          <Separator className="my-16" />

          <section>
            <h2
              className={`${merriweather.className} text-[28px] text-branding-brown `}
            >
              {t("ExternalArchives.physical-archives.title")}
            </h2>
            <p className="font-['Helvetica Neue'] font-light text-base text-branding-black mt-4">
              {t("ExternalArchives.physical-archives.description")}
            </p>
            <ResourceList items={physicalArchives} />
          </section>
        </main>
      </div>
    </div>
  );
}
