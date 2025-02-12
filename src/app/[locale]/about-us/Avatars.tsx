import Image from "next/image";
import { getImageByKey } from "@/utils/image";

import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default function Avatar({ teamMember }) {
  return (
    <div className="md:col-span-2 font-['Helvetica Neue'] text-branding-black">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teamMember &&
          teamMember.map((teamMember) => (
            <div
              key={teamMember.name}
              className="w-full flex flex-col items-center mb-5"
            >
              <Image
                unoptimized
                className="w-52 h-52 rounded-full mb-4 object-cover"
                width={192}
                height={192}
                src={
                  teamMember.avatar
                    ? getImageByKey(teamMember.avatar.formats, "small")!.url
                    : "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
                }
                alt={
                  teamMember.avatar
                    ? teamMember.avatar.alternativeText
                    : `Avatar of ${teamMember.name}`
                }
              />

              <div className="text-left w-56">
                <h3
                  className={`${merriweather.className} text-branding-brown mb-2 mt-3`}
                >
                  {teamMember.name}
                </h3>
                <p className="font-bold font-['Helvetica Neue'] font-semibold text-left">
                  {teamMember.title}
                </p>
                <p className="text-left font-['Helvetica Neue'] font-light">
                  {teamMember.description}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
