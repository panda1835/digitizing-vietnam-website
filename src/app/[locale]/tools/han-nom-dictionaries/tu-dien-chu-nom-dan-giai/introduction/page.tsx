import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export default function Introduction() {
  return (
    <div>
      <div className={`${merriweather.className} text-branding-black text-4xl`}>
        Tự Điển Chữ Nôm Dẫn Giải
      </div>
      <div className="font-['Helvetica_Neue'] font-light text-lg mt-6">
        <p className="pt-5">
          To date, research and compilations of Nôm characters have obtained
          many important achievements. I would like to discuss briefly two Nôm
          dictionaries that have appeared in recent years and are most related
          to <i>Nôm characters with Quotations and Annotations</i>:
          <span className=""> </span>
        </p>
        <p className="pt-5">
          (a) <i>Tự điển Chữ Nôm </i>(<i>Dictionary of Nôm characters</i>): The
          collective work by the Institute of Hán Nôm Studies, under Nguyễn
          Quang Hồng as the chief editor, published by the Publisher of
          Education in Hà Nội in 2006. The book contains 1.546 pages, and the
          size is 16x24 cm. This is the first Nôm characters dictionary in which
          quotations from Nôm works (almost 50 texts) are provided for each
          character. It has been highly reviewed in recent years. This
          dictionary has more characters than the Nôm dictionaries preceding it,
          however it is still not fully plentiful (as there are 7.888 glyphs
          with 12.000 units described). For each character, there is explanation
          and analysis of word structure. However, there are still places that
          are not accurate or entirely rational. In the context of that period,
          the editorial board could not provide quotations in the original Nôm
          characters, but only in Quốc ngữ transliteration.{" "}
          <span className=""> </span>
        </p>
        <p className="pt-5">
          (b). <i>Tự điển Chữ Nôm trích dẫn</i> (
          <i>Dictionary of Nôm characters with quotations</i>): The collective
          work compiled by the Institute of Vietnamese Studies in the United
          States (including 7 co-authors), published by the Institute of
          Vietnamese Studies, printed in Taiwan, in 2009, 1.708 pages, size
          19x26 cm. The authors collected data using computers, and for the
          first time provided quotations in the original Nôm characters (with
          standard and accurate Nôm fonts created by the author) accompanied by
          Quốc Ngữ transliterations. The number of Nôm texts used is larger (60
          texts) with many works on Nôm from the South of Vietnam. Although
          being presented as a dictionary, this work has no explanations for Nôm
          characters and there is no structural analysis of each character.
          <span className=""> </span>
        </p>
        <p className="pt-5">
          Recognizing the advantages and disadvantages of previous works and the
          need to apply new approaches and methods has led me to compile{" "}
          <i>Nôm Characters with Quotations and Annotations</i>. My wish is to
          contribute to society a new-style dictionary of Nôm characters, with
          higher capacity and quality than preceding dictionaries.
          <span className=""> </span>
        </p>
        <p className="pt-5">
          For basic understanding of the subject, the book{" "}
          <i>Khái luận văn tự học Chữ Nôm </i>(
          <i>An Introduction to Nôm characters Grammatology</i>) (Nguyễn Quang
          Hồng, Publisher of Education, Hồ Chí Minh city, 2008, 538 pages) has
          been available. In this book, the characteristics of chữ Nôm are
          determined from a diachronic perspective and, especially, new
          classification and concepts of the structures and functional
          environments of Nôm characters are provided (distinguishing between{" "}
          <i>formal</i> structures and <i>functional</i> structures, <i>deep</i>{" "}
          structures and <i>surface</i> structures). All these are very
          necessary for the selection, explanation, transliteration of texts,
          and also for the analysis and classification of Nôm characters
          structures in the dictionary. This system of textual theories was not
          fully developed when the author was working as the chief editor on the
          dictionary mentioned in (A), and it is now applied for the first time
          in the compilation of <i>Chữ Nôm with Quotations and Annotations</i>.
        </p>
        <p className="pt-5">
          For materials, the author began by collecting Nôm characters texts.
          After that the author selected 124 documents (many times more than the
          number of documents used in previous dictionaries) of various formats
          and belonging to different time periods. For famous Nôm works, the
          author sometimes used two or three different texts. He solely
          performed all the steps of this work on the computer (except some
          steps in the final stage), thereby avoiding the problem of multiple
          errors in consistency that can occur when many people are working on a
          text.
          <span className="">  </span>Besides, we have recognized and put in the{" "}
          <i>Appendix</i> section more character forms and pronunciations
          presented in the two well-known dictionaries of P. de Béhaine (1772)
          and J.L. Taberd (1838). <span className=""> </span>
        </p>
        <p className="pt-5">
          In this dictionary, the reader first looks up a Nôm character based on
          pronunciation (known or predicted). Corresponding to each modern
          Vietnamese syllable, there will be tens of different characters. Each
          character is a descriptive unit consisting of two columns: (a) A{" "}
          <i>Chữ Nôm</i> column identifying the glyph, pronunciation, and code
          of the character (according to Unicode or Vcode). (b) An explanation
          column consisting of structural analysis of the character and
          explanation of meaning. All different syllables (corresponding to one
          or several Nôm Characters), are arranged according to the alphabet of
          Quốc Ngữ. To look up an unfamiliar character for which one does not
          know or cannot predict the pronunciation, one can first look up the
          character in <i>Chữ Nôm Look-Up Table by Radicals</i>, then go to the
          page having that pronunciation. <span className=""> </span>
        </p>
        <p className="pt-5">
          In the process of compiling this dictionary, the author used all the
          Nôm and Hán fonts currently available for computers, with the main
          font being <i>Nom Na Tong. </i>This dictionary gathered 9.200
          different Nôm glyphs (not including the 250 characters in the{" "}
          <i>Appendix </i>
          section), corresponding to 14.519 pronunciations documented in
          contemporary Vietnamese national script (based on latin alphabet, chữ
          Quốc Ngữ), 3.000 of which were constructed by the author and had never
          been presented in the available Nôm fonts and dictionaries. For the
          modifications of these “new” Nôm characters, the author has received
          sponsorship, both in terms of human resources and materials, from the
          <i> Nôm Preservation Foundation</i> (United States).
          <span className="">  </span>The <i>Nôm Preservation Foundation</i> (in
          the United States) has supported the entire expense not only the
          regard of publishing but also for the printing of{" "}
          <i>Nôm characters with Quotations and Annotations.</i> Just because of
          this, before welcoming the dictionary to come on the scene, the author
          would like to express his profound gratitude to this organization and
          the employees of its office in Hanoi, the <i>Nôm Na</i> group.
          <span className=""> </span>
        </p>
        <p className="pt-5">
          The author also sincerely thanks all his colleagues at the Institute
          of Hán Nôm Studies and the Literature Department of the Hanoi
          University of Humanities and Social Sciences for having provided some
          rare and valuable Nôm characters materials, helping to enrich the
          source of materials of this dictionary.
        </p>
        <p className="pt-5">
          Finally, the author is honored that the Social Sciences Publishing
          House (Vietnam Academy of Social Sciences) with the{" "}
          <i>Nôm Preservation Foundation</i> (United States) has co-operated to
          assume responsibility in publishing{" "}
          <i>Nôm characters with Quotations and Annotations</i> and introducing
          it to readers in this country as well as abroad.
          <span className=""> </span>
        </p>
        <p className="pt-5">
          The author hopes that the readers of this dictionary are not only
          researchers in the Hán Nôm areas, but also all those who would{" "}
          <span className="s2">
            like to find traces of the language and writing system, literature
            and culture of the Vietnamese in the distant past, but still
            extremely close to
          </span>{" "}
          today’s life. 
        </p>
        <p className="pt-5">
          Although the author has tried his best for many years to realize this
          work with high expectation, mistakes are inevitable. The author hopes
          to receive forgiveness and instructive feedback from the readers.
        </p>
        <p className="pt-5">
          <br />
        </p>
        <p className="pt-5">
          <i>Author</i>
        </p>
        <p className="pt-5">Professor NGUYỄN QUANG HỒNG</p>
      </div>
    </div>
  );
}
