import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const trimDescription = (content, max_word) => {
  const words = content.split(" ");
  if (words.length > max_word) {
    return `${words.slice(0, max_word).join(" ")}...`;
  }
  return content;
};

const Item = (props) => {
  const { t } = useTranslation();
  const screen_width = window.innerWidth;
  return (
    <div className="mb-5">
      <Link to={props.link}>
        <img
          src={props.imageUrl}
          alt={props.title}
          className="object-cover rounded-lg w-full h-40"
        />

        <div className="text-xl text-primary-blue mt-2">{props.title}</div>
      </Link>

      <p className="text-gray-500">
        {screen_width < 640
          ? props.description
          : trimDescription(props.description, props.max_trim_word)}{" "}
        <Link to={props.link} className="text-primary-blue cursor-pointer">
          {" "}
          {t("btn-read-more")}
        </Link>
      </p>
    </div>
  );
};

export default Item;
