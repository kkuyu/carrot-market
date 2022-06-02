import { NextApiRequest, NextApiResponse } from "next";

import client from "../../../libs/client/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
  }
  console.log(req.body);
  res.json({ success: true });
}