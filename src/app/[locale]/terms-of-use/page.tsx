import { notFound } from "next/navigation";
import { Merriweather } from "next/font/google";
import { setRequestLocale } from "next-intl/server";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default function TermsOfUsePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  if (locale !== "vi" && locale !== "en") notFound();
  setRequestLocale(locale);
  const vi = locale === "vi";
  const sections = vi
    ? [
        [
          "Quyền tác giả",
          "Tư liệu thuộc quyền tác giả của tác giả và chủ sở hữu quyền. Digitizing Việt Nam cung cấp quyền truy cập phiên bản số theo sự cho phép của chủ sở hữu quyền và không sở hữu nội dung tư liệu.",
        ],
        [
          "Phạm vi sử dụng",
          "Người dùng được xem, tra cứu và trích dẫn hợp lý để phục vụ học tập, giảng dạy và nghiên cứu.",
        ],
        [
          "Ghi nguồn",
          "Khi trích dẫn, người dùng ghi tác giả, tên tác phẩm, nhà xuất bản, năm xuất bản, mục từ hoặc số trang (nếu có), tên Digitizing Việt Nam và đường dẫn đến tư liệu. Nội dung trích dẫn không được làm sai lệch ý tác giả.",
        ],
        [
          "Giới hạn",
          "Khi chưa có chấp thuận bằng văn bản của chủ sở hữu quyền, người dùng không được sao chép toàn bộ, tải xuống hàng loạt hay trích xuất có hệ thống, không được tái xuất bản, phân phối lại hoặc tạo bản thay thế cho tác phẩm, và không được sử dụng vì mục đích thương mại.",
        ],
        [
          "Phản ánh",
          "Người dùng liên hệ info@digitizingvietnam.com để báo sai sót, phản ánh về quyền hoặc trao đổi nhu cầu sử dụng ngoài phạm vi trên. Digitizing Việt Nam có thể điều chỉnh, tạm ngừng hiển thị hoặc gỡ nội dung liên quan.",
        ],
      ]
    : [
        [
          "Copyright",
          "Materials remain under the copyright of their authors and rights holders. Digitizing Việt Nam provides access to digital versions with permission from rights holders and does not own the materials.",
        ],
        [
          "Permitted use",
          "Users may view, consult, and make reasonable citations of materials for learning, teaching, and research.",
        ],
        [
          "Attribution",
          "Citations should include the author, title, publisher, publication year, entry or page number (if available), Digitizing Việt Nam, and a link to the material. Citations must not misrepresent the author's meaning.",
        ],
        [
          "Restrictions",
          "Without written permission from the rights holder, users may not copy an entire work, download materials in bulk or systematically extract them, republish, redistribute, create a substitute copy, or use materials commercially.",
        ],
        [
          "Questions and concerns",
          "Contact info@digitizingvietnam.com to report an error, raise a rights concern, or discuss use outside this scope. Digitizing Việt Nam may revise, temporarily suspend display of, or remove relevant material.",
        ],
      ];
  const title = vi ? "Điều kiện sử dụng" : "Terms of Use";

  return (
    <main className="w-full pb-20">
      <BreadcrumbAndSearchBar
        locale={locale}
        breadcrumbItems={[{ label: title }]}
      />
      <h1
        className={`${merriweather.className} mt-8 text-3xl text-branding-black`}
      >
        {title}
      </h1>
      <div className="mt-8 max-w-4xl space-y-7 text-base font-light leading-relaxed text-branding-black">
        {sections.map(([heading, content]) => (
          <section key={heading}>
            <h2 className="mb-2 text-xl font-normal">{heading}</h2>
            <p>
              {content.includes("info@digitizingvietnam.com") ? (
                <>
                  {content.split("info@digitizingvietnam.com")[0]}
                  <a
                    className="underline"
                    href="mailto:info@digitizingvietnam.com"
                  >
                    info@digitizingvietnam.com
                  </a>
                  {content.split("info@digitizingvietnam.com")[1]}
                </>
              ) : (
                content
              )}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
