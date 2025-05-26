"use client";

export default function TipBox({ text }: { text: string }) {
  return (
    <div className="border border-gray-300 rounded-md p-2 bg-white w-full text-left max-w-full text-md font-sans shadow-[4px_4px_0px_0px_#a5701c]">
      <span className="font-semibold text-gray-700">Tips:</span>{" "}
      <span className="text-gray-700">{text}</span>
    </div>
  );
}
