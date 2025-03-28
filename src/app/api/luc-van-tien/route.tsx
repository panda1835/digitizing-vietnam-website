import { NextResponse } from "next/server";
import fs from "fs/promises";
import { parseStringPromise } from "xml2js";
import path from "path";

export async function GET() {
  try {
    let returnData = {};

    const xmlDictionaryData = await fs.readFile(
      path.join(process.cwd(), `data/luc-van-tien/Luc_Van_Tien.xml`),
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

    return NextResponse.json(returnData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
