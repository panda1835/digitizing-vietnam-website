import { Link } from "react-router-dom";

const Item = (props) => {
  return (
    <Link to={props.link}>
      <div className="mb-5">
        <img
          src={props.imageUrl}
          alt={props.title}
          className="object-cover rounded-lg w-full h-40"
        />
        <div className="text-xl text-primary-blue mt-2">{props.title}</div>
        <p className="text-gray-500">{props.description}</p>
      </div>
    </Link>
  );
};

export default Item;
