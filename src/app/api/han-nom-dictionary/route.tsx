import { NextResponse } from "next/server";
import fs from "fs/promises";
import { parseStringPromise } from "xml2js";
import path from "path";

// Cache dictionary data for 6 hours (XML files rarely change)
export const revalidate = 21600;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const dictionaryParam = searchParams.get("dictionary");
    console.log(dictionaryParam);

    if (!dictionaryParam) {
      return NextResponse.json(
        { error: "Missing dictionary parameter" },
        { status: 400 }
      );
    }

    let returnData = {};

    if (dictionaryParam == "tu-dien-chu-nom-dan-giai") {
      const xmlDictionaryData = await fs.readFile(
        path.join(
          process.cwd(),
          "data/dictionaries/tu-dien-chu-nom-dan-giai/tdcndg.xml"
        ),
        "utf-8"
      );

      const jsonDictionaryData = await parseStringPromise(xmlDictionaryData);

      const xmlRefData = await fs.readFile(
        path.join(
          process.cwd(),
          "data/dictionaries/tu-dien-chu-nom-dan-giai/tdcndg_refs.xml"
        ),
        "utf-8"
      );
      const jsonRefData = await parseStringPromise(
        xmlRefData.replace(/<\/?i>/g, "")
      );

      returnData = {
        dictionary: jsonDictionaryData.dictionary.entry,
        ref: jsonRefData.reference_list.reference,
      };
    } else if (dictionaryParam == "giup-doc-nom-va-han-viet") {
      const xmlDictionaryData = await fs.readFile(
        path.join(
          process.cwd(),
          "data/dictionaries/giup-doc-nom-va-han-viet/gdnhv.xml"
        ),
        "utf-8"
      );
      const jsonDictionaryData = await parseStringPromise(
        xmlDictionaryData.replace(/<\/?cit>/g, "")
      );
      returnData = {
        dictionary: jsonDictionaryData.TEI.text[0].body[0].entry,
      };
    } else {
      return NextResponse.json(
        { error: "Unknown dictionary" },
        { status: 400 }
      );
    }
    return NextResponse.json(returnData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
