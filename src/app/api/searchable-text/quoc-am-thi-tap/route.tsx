import { NextResponse } from "next/server";
import db from "@/lib/db";
import fs from "fs/promises";
import { parseStringPromise } from "xml2js";
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const topicId = searchParams.get("topicId");
    let returnData = {};

    const [data]: any = await db.query(`SELECT * FROM qatt WHERE (id = ?)`, [
      topicId,
    ]);

    const [allTopics]: any = await db.query(
      `SELECT \`id\`, \`group\`, qn_title, hn_title, title_num FROM qatt `
    );

    // Parse the string as XML
    const parsedQn = await parseStringPromise(data[0].qn_body);
    const parsedHn = await parseStringPromise(data[0].hn_body);

    returnData = {
      id: data[0].id,
      group: data[0].group,
      qn_title: data[0].qn_title,
      title_num: data[0].title_num,
      hn_title: data[0].hn_title,
      qn_body: parsedQn,
      hn_body: parsedHn,
      all_ids: allTopics.map((item) => item.id),
      all_groups: allTopics.map((item) => item.group),
      all_qn_titles: allTopics.map((item) => item.qn_title),
      all_hn_titles: allTopics.map((item) => item.hn_title),
      all_title_nums: allTopics.map((item) => item.title_num),
    };

    return NextResponse.json(returnData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
