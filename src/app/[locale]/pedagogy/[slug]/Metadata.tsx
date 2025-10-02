import { getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDate } from "@/utils/datetime";
import { Link } from "@/i18n/routing";

export async function PedagogyMetadata({ metadata, locale }) {
  const t = await getTranslations();
  let formattedMetadata = {};
  if (metadata) {
    if (metadata.__component === "pedagogy.mini-lecture") {
      formattedMetadata = {
        "lecture-title": metadata.name,
        lecturers: metadata.lecturers,
        description: metadata.description,
        duration: metadata.duration,
        "date-created": formatDate(metadata.date_created, locale),
      };
    } else if (metadata.__component === "pedagogy.podcast") {
      formattedMetadata = {
        "podcast-title": metadata.podcast_title,
        "episode-title": metadata.episode_title,
        "episode-number": metadata.episode_number,
        host: metadata.host,
        guest: metadata.guest,
        "release-date": formatDate(metadata.release_date, locale),
        "episode-url": metadata.episode_url,
        "podcast-url": metadata.podcast_url,
        duration: metadata.duration,
        transcript: metadata.transcript || "N/A",
      };
    } else if (metadata.__component === "pedagogy.syllabus") {
      formattedMetadata = {
        "course-title": metadata.name,
        semester: metadata.semester,
        instructor: metadata.instructor,
        affiliation:
          (metadata.affiliation &&
            metadata.affiliation
              .map(
                (affiliation) =>
                  `${affiliation.institution} - ${affiliation.department}`
              )
              .join(", ")) ||
          "N/A",
      };
    } else if (metadata.__component === "pedagogy.dh-tool") {
      formattedMetadata = {
        name: metadata.name,
        creators: metadata.creators,
        description: metadata.description,
        "supported-languages": metadata.supported_languages
          .map((lang) => lang.name)
          .join(", "),
        "date-created": metadata.date_created,
        affiliation:
          (metadata.affiliation &&
            metadata.affiliation
              .map(
                (affiliation) =>
                  `${affiliation.institution} - ${affiliation.department}`
              )
              .join(", ")) ||
          "N/A",
        "access-url": metadata.access_url,
      };
    } else if (metadata.__component === "pedagogy.textbook") {
      formattedMetadata = {
        name:
          metadata.title + (metadata.subtitle ? " - " + metadata.subtitle : ""),
        creators:
          (metadata.creators &&
            metadata.creators
              .map(
                (author) =>
                  `${author.author.name} (${author.author_role_term.name})`
              )
              .join(", ")) ||
          "N/A",
        publisher: metadata.publisher.name || "N/A",
        publication_year: metadata.publication_year,
        identifier: metadata.identifier,
        languages:
          (metadata.languages &&
            metadata.languages
              .map((language) => `${language.name}`)
              .join(", ")) ||
          "N/A",
        subjects:
          (metadata.subjects &&
            metadata.subjects.map((subject) => `${subject.name}`).join(", ")) ||
          "N/A",
        access_condition: metadata.access_condition.description || "N/A",
        place_of_publication: metadata.place_of_publication.name || "N/A",
        item_size: metadata.item_size || "N/A",
      };
    }
  }

  return (
    <div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border rounded-lg px-4 mb-4">
          <AccordionTrigger className="text-branding-brown text-xl font-normal font-['Helvetica Neue'] leading-relaxed">
            {t("Outreach.metadata.metadata")}
          </AccordionTrigger>
          <AccordionContent>
            <div>
              {Object.entries(formattedMetadata).map(([key, value]) => {
                if (value === "N/A" || value === "") return null;
                return (
                  <div
                    key={key}
                    className="font-['Helvetica Neue'] text-base font-light mt-2"
                  >
                    <strong className="text-[#777777] text-lg font-normal">
                      {t(`Outreach.metadata.${key}`)}:
                    </strong>{" "}
                    {typeof value === "string" &&
                    (value.startsWith("http://") ||
                      value.startsWith("https://")) ? (
                      <Link
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        {value}
                      </Link>
                    ) : (
                      (value as string)
                    )}
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
