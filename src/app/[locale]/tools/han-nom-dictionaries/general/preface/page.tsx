import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default function Introduction({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return <div>{locale === "vi" ? <div></div> : <div></div>}</div>;
}
