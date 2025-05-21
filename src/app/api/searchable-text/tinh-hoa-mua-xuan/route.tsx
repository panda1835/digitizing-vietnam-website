import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const topic = searchParams.get("topic");
    let returnData = {};

    // const xmlDictionaryData = await fs.readFile(
    //   path.join(process.cwd(), `data/luc-van-tien/Luc_Van_Tien.xml`),
    //   "utf-8"
    // );

    const [data]: any = await db.query(
      `SELECT * FROM tho_hxh WHERE (qn_topic = ?)`,
      [topic]
    );

    const [allTopics]: any = await db.query(
      `SELECT nom_topic, qn_topic, en_topic FROM tho_hxh `,
      [topic]
    );

    returnData = {
      nom_topic: data[0].nom_topic,
      qn_topic: data[0].qn_topic,
      en_topic: data[0].en_topic,
      nom: data[0].nom,
      qn: data[0].qn,
      en: data[0].en,
      note_en: data[0].note,
      note_vi: data[0].note_vn,
      all_nom_topic: allTopics.map((item) => item.nom_topic),
      all_qn_topic: allTopics.map((item) => item.qn_topic),
      all_en_topic: allTopics.map((item) => item.en_topic),
    };

    return NextResponse.json(returnData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
