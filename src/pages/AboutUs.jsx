import React from "react";

const AboutUs = () => {
  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 mx-5">
        <h1 className="flex justify-center">About Us</h1>

        <h2>Our Mission</h2>

        <p className="mb-5">
          Digitizing Vietnam (DV) is the first joint web platform project
          following the establishment of the Columbia University - Fulbright
          University Vietnam partnership. The DV web platform is a free and
          open-to-public-use digital Vietnam Studies platform which aims to be
          the well integrated hub for digital humanities research.
        </p>
        <p className="mb-5">
          Functioning as a digital resources hub in the form of a virtual
          exhibition hall maintained by Columbia University (CU) and the Vietnam
          Studies Center (VSC) at Fulbright University Vietnam (FUV), DV makes
          available an extensive archive of digitized premodern manuscript
          collections and provides a selective catalog for archival and library
          collections of the modern era originating from Vietnam. DV also serves
          as a platform for developing advanced digital humanities tools for
          analysis, beginning with a labeling tool that facilitates the
          annotation and translation of the pre-modern digital repository to
          enhance scholarly research.
        </p>

        <p className="mb-5">
          With the built-in relationship between Vietnam Studies and Computer
          Science at FUV, DV supports the development of innovative tools to
          bring historical preservation in Vietnam to a new level. Founded on
          the value of collaboration, primarily through the joint initiatives
          put forward by CU-FUV, DV facilitates cooperation networks and aligns
          distinct “digitizing Vietnam” efforts, which will transform the field
          of Vietnamese Studies on a global scale.
        </p>

        <p className="mb-5">
          In addition to functioning as a digital workbench and repository
          containing new digital resources and new digital humanities tools, DV
          during its second and third phases of development will succesively
          launch the Vietnam for Educators platform and the Understanding
          Vietnam platform. The former will provide production of translations,
          curated images, lessons, and other resources for teaching Vietnam,
          while the latter will offer online mini-lectures, podcasts, and other
          materials designed to introduce Vietnam to mainstream audiences.
        </p>

        <h2>Core Team</h2>

        <ul className="mb-5 list-disc ml-5">
          <li>
            Tram Phuong Nguyen, Ph.D. in Ethnology Digital Curator, Weatherhead
            East Asian Institute, Columbia University
          </li>

          <li>
            Van Nguyen Tuong Le, M.A. in Digital Humanities Digital Humanities
            Librarian, Vietnam Studies Center, Fulbright University Vietnam
          </li>
          <li>
            Phuc Le, BA in Computer Science Website Developer, Columbia
            University
          </li>
        </ul>

        <h2>Advisors</h2>

        <ul className="mb-5 list-disc ml-5">
          <li>
            Hoang Minh Vu, Ph.D. in History Faculty member in History and
            Vietnam Studies, Fulbright University Vietnam
          </li>
          <li>
            John Phan, Ph.D. in East & Southeast Asian Language History
            Assistant Professor, Director of Undergraduate Studies, EALAC,
            Columbia University
          </li>
          <li>
            Lien-Hang Nguyen, Ph.D. in History Assistant Professor, Director of
            the Weatherhead East Asian Institute, Columbia University
          </li>
          <li>
            Nam Nguyen, Ph.D. in East Asian Languages and Civilizations
            Professor, Director of the Vietnam Studies Center, Fulbright
            University Vietnam
          </li>
        </ul>

        <h2>Institutional Support</h2>

        <ul className="mb-5 list-disc ml-5">
          <li>Columbia University</li>
          <li>École Pratiques des Hautes Études, Paris</li>
          <li>Fulbright University Vietnam</li>
          <li>Institute of Sino-Nom Studies</li>
          <li>Vietnam State Archives</li>
          <li>Vietnam National University Ho Chi Minh University of Science</li>
        </ul>

        <h2>Funding</h2>
        <p className="mb-5">
          In August 2023, the Weatherhead East Asia Institute at Columbia
          University was awarded a{" "}
          <a
            href="https://www.hluce.org/programs/asia/grant-categories/luce-initiative-southeast-asia/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500"
          >
            LuceSEA
          </a>{" "}
          grant from the{" "}
          <a
            href="https://www.hluce.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500"
          >
            Henry Luce Foundation
          </a>{" "}
          to support Digitizing Vietnam: The Virtual Future of Global Vietnam
          and the Vietnamese Studies Project.
        </p>

        <h2>Our Collections</h2>
        <p className="mb-5">
          The Digitizing Vietnam Collections consist of the digitized pre-modern
          Han-Nom manuscript collections, modern era Vietnamese Studies
          collections including but not limited to history studies content,
          linguistics, ethnology/cultural anthropology, Vietnamese
          early-20th-century journals as well as collections of Vietnamese
          contemporary music and folk music.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
