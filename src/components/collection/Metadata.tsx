export default function Metadata({ collection }) {
  return (
    <div className="space-y-2">
      <div className="text-sm">
        <p>
          <span className="font-bold">Created</span>: {collection.datePublished}
        </p>
        <p>
          <span className="font-bold">Formats</span>:{" "}
          {collection.format.join(", ")}
        </p>
        <p>
          <span className="font-bold">Languages</span>:{" "}
          {collection.language.join(", ")}
        </p>
        <p>
          <span className="font-bold">Subjects</span>:{" "}
          {collection.subject.join(", ")}
        </p>
        <p>
          <span className="font-bold">Location</span>:{" "}
          {collection.collectionLocation}
        </p>
        <p>
          <span className="font-bold">Access Condition</span>:{" "}
          {collection.accessCondition}
        </p>
      </div>
    </div>
  );
}
