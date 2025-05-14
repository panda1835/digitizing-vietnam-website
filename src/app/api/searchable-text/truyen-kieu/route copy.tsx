import { NextResponse } from "next/server";
import fs from "fs/promises";
import { parseStringPromise } from "xml2js";
import path from "path";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const version = searchParams.get("version");

    if (!version) {
      return NextResponse.json(
        { error: "Missing dictionary parameter" },
        { status: 400 }
      );
    }

    let returnData = {};
    const allowVersion = ["1866", "1870", "1871", "1872", "1902"];
    if (allowVersion.includes(version)) {
      const xmlDictionaryData = await fs.readFile(
        path.join(process.cwd(), `data/truyen-kieu/Kieu${version}.xml`),
        "utf-8"
      );

      const jsonKieuRawText = await parseStringPromise(xmlDictionaryData);
      const jsonKieuText = await parseStringPromise(
        xmlDictionaryData.replace(/<seg[^>]*>(.*?)<\/seg>/g, "$1")
      );

      returnData = {
        rawText: jsonKieuRawText.TEI.text[0].body[0].page,
        text: jsonKieuText.TEI.text[0].body[0].page,
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
