// eslint-disable-next-line import/no-unresolved
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

const trimDescription = (content, max_word) => {
  const words = content.split(" ");
  if (words.length > max_word) {
    return `${words.slice(0, max_word).join(" ")}...`;
  }
  return content;
};

const Item = (props) => {
  const t = useTranslations("Button");

  return (
    <div className="mb-5">
      <Link href={props.link}>
        <Image
          unoptimized
          src={props.imageUrl.url}
          alt={props.title}
          width={props.imageUrl.width}
          height={props.imageUrl.height}
          className="object-cover rounded-lg w-full h-40"
        />

        <div className="text-xl text-primary-blue mt-2">{props.title}</div>
      </Link>

      <p className="text-gray-500">
        <span className="hidden sm:inline">
          {" "}
          {/* Hide on small screens */}
          {trimDescription(props.description, props.max_trim_word)}
        </span>
        <span className="sm:hidden">
          {" "}
          {/* Show only on small screens */}
          {props.description}
        </span>{" "}
        <Link href={props.link} className="text-primary-blue cursor-pointer">
          {" "}
          {t("read-more")}
        </Link>
      </p>
    </div>
  );
};

export default Item;
