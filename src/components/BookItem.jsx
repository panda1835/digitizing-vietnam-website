import { Link } from "../i18n/routing.ts";

const BookItem = (props) => {
  return (
    <Link href={props.link}>
      <div className="border-solid border-2 flex flex-col items-center justify-center rounded-lg py-2 w-64">
        <img
          src={props.imageUrl}
          alt={props.title}
          className="object-cover rounded-lg w-56 h-full"
        />
        <div className="text-xl text-primary-blue mt-2 px-2">{props.title}</div>
      </div>
    </Link>
  );
};

export default BookItem;
