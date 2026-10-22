import PageHeader, { Card, SectionTitle } from "@/components/nom-explorer/PageHeader";

export const metadata = { title: "Guide · Nôm Component Explorer" };

const TYPES: [string, string, string, string][] = [
  ["A1", "才", "tài", "Hán character borrowed for meaning, read in Sino-Vietnamese."],
  ["A2", "务", "mùa", "Borrowed for meaning, read with an older or Vietnamized form of the SV reading."],
  ["B", "凸", "lồi", "Borrowed for meaning, read with a native Vietnamese word."],
  ["C1", "没", "một", "Borrowed for sound, read exactly as its SV reading."],
  ["C2", "饒", "nhau", "Borrowed for sound, read with an approximation of its SV reading."],
  ["D1 / D2", "", "lần, trở", "Two phonetic elements (hội âm): coordinate / head + modifier. Often spells an old cluster."],
  ["E1 / E2", "", "trời, tro", "Two semantic elements (hội ý): coordinate / head + modifier."],
  ["F1 / F2", "", "trăm, ghét", "Semantic + phonetic (hình thanh): coordinate / head + modifier."],
  ["G1 / G2", "", "nào, đi", "A character modified by removing (G1) or adding (G2) strokes, including the 个 and ‹ marks."],
];

export default function Guide() {
  return (
    <div>
      <PageHeader crumbs={[{ label: "Guide" }]} title="Guide" subtitle="Where the data comes from and how the analyses are computed." />

      <section className="mb-12">
        <SectionTitle>Source</SectionTitle>
        <Card>
          <p className="text-[15px] leading-relaxed max-w-3xl">
            Every structural analysis comes from Nguyễn Quang Hồng&rsquo;s <em>Tự điển chữ Nôm dẫn giải</em>, as digitized
            for the Digitizing Việt Nam Hán-Nôm Lookup (<code>data/dictionaries/tu-dien-chu-nom-dan-giai/tdcndg.xml</code> in
            the site repository). Each entry pairs a character and one Nôm reading with a structure line such as
            <span className="han"> F2: khẩu 口⿰可 khả</span>: the type code, the semantic element with its SV name,
            the layout operator, and the phonetic element with its SV reading. Run <code>npm run build-index</code> to
            rebuild the index after the dictionary data changes.
          </p>
        </Card>
      </section>

      <section className="mb-12">
        <SectionTitle note="Nguyễn Quang Hồng, Khái luận văn tự học chữ Nôm (2008), as adapted in the dictionary.">Structural types</SectionTitle>
        <Card className="p-0">
          <table className="w-full text-sm">
            <tbody>
              {TYPES.map(([code, ch, rd, desc]) => (
                <tr key={code} className="border-b border-branding-gray last:border-0">
                  <td className="px-4 py-2 font-normal w-20">{code}</td>
                  <td className="px-2 py-2 han text-2xl w-12">{ch}</td>
                  <td className="px-2 py-2 text-[var(--ink-2)] w-24">{rd}</td>
                  <td className="px-2 py-2">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section className="mb-12">
        <SectionTitle>Middle Chinese</SectionTitle>
        <Card>
          <div className="text-[15px] leading-relaxed max-w-3xl space-y-3">
            <p>
              Middle Chinese readings are the <em>Guangyun</em> 廣韻 positions given by nk2028&rsquo;s{" "}
              <a className="link" href="https://github.com/nk2028/tshet-uinh-js" target="_blank" rel="noreferrer">tshet-uinh</a>{" "}
              library (MIT licence), looked up for each phonetic: the character the dictionary names, then the form
              written, then the radical or traditional form. About three quarters of component characters have a
              reading; Nôm-only characters do not.
            </p>
            <p>
              Tones are grouped by tone and initial: voiceless (清, aspirated or not), sonorant (次濁) and voiced
              obstruent (全濁). Where a character has several readings, the one whose class regularly gives the
              Sino-Vietnamese reading the dictionary cites is used: 平 → ngang (清, 次濁) or huyền (全濁); 上 → hỏi (清),
              ngã (次濁), nặng or ngã (全濁); 去 and 入 → sắc (清) or nặng (次濁, 全濁). A starred class in the tables
              means the cited Sino-Vietnamese tone is not that regular reflex (幻 ảo, for instance).
            </p>
          </div>
        </Card>
      </section>

      <section className="mb-12">
        <SectionTitle>How components are matched</SectionTitle>
        <Card>
          <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed max-w-3xl">
            <li>
              <strong className="font-normal">Roles follow the type code, and F phonetics are inferred.</strong> In D both
              elements are phonetic and in E both are semantic. In F the dictionary lists the two elements in layout
              order (<span className="han">口⿰可</span> khả, but <span className="han">句⿰鳥</span> điểu for câu), so the
              phonetic is identified from two kinds of evidence. Sound: whose SV reading is closer to the Nôm reading, with
              the rime counting for more than the initial, since Nôm phonetics keep the rime far more reliably. Precedent:
              how each element behaves across the clear cases (口 is semantic in over a thousand characters, 侖 almost
              always phonetic). Strong, contrasting precedent outweighs sound unless the sound evidence is overwhelming, so
              a chance kh- match does not make 口 the phonetic of 𠳚 khảy (口 + 改 cải). Rows decided by precedent carry a
              ≈ mark and appear on the Review page. Eight structure lines give their two readings in the opposite order to
              the characters; these are corrected first (see Sources). Entries with no type
              code (about twenty) are treated as F and shown with &ldquo;?&rdquo;.
            </li>
            <li>
              <strong className="font-normal">Cluster initials.</strong> In two-phonetic (D) compounds one element
              sometimes gives only the initial, usually the first consonant of an old cluster: 𪩮 trăng = 巴 (*b-) +
              夌 lăng [*bl- → tr-]. An element is treated as initial-only when the dictionary marks the compound with a
              cluster note, or, in D2 compounds, when the element plays that role in at least two noted cases (巴, 巨, 車,
              古, 麻, 阿). The rime element is the one read with l- (the cluster&rsquo;s second consonant), else the one whose
              rime and tone are closer. Initial-only uses count toward initials but not rimes or tones. The reading marks
              亇 and 个 spell no sound and are left out. Every case can be corrected on the Review page.
            </li>
            <li>
              <strong className="font-normal">Variant forms are merged.</strong> Radical forms (氵/水, 扌/手, 亻/人 …) and
              simplified/traditional pairs count as one component, using the same table as the DVN lookup.
            </li>
            <li>
              <strong className="font-normal">Substitutions count for both.</strong> In <span className="han">火⿰廬 → 卢</span>
              the phonetic is 廬 written as 卢; the character appears under both.
            </li>
            <li>
              <strong className="font-normal">Deeper containment follows the dictionary.</strong>{" "}
              <span className="han">𠶚</span> = 口 + <span className="han">妸</span>, and <span className="han">妸</span> = 女 +
              可, so <span className="han">𠶚</span> contains 可 at depth 2. Borrowed Hán characters (A, B, C) have no
              breakdown in the dictionary, so 阿 does not count as containing 可.
            </li>
            <li>
              <strong className="font-normal">Readings are compared phonologically.</strong> Each syllable is split into
              initial, rime and tone. Spellings of one sound (c/k, g/gh, ng/ngh) count as one initial; qu and gi are kept
              as written. When a phonetic has alternative SV readings (thiêu|khiêu), the closer one is used.
            </li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
