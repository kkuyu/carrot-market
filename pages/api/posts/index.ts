import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    const posts = await client.post.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            curiosities: true,
            comments: true,
          },
        },
      },
    });
    return res.status(200).json({
      success: true,
      posts,
    });
  }
  if (req.method === "POST") {
    const { question, latitude, longitude } = req.body;
    const { user } = req.session;
    if (!question) {
      const error = new Error("Invalid request body");
      throw error;
    }
    const newPost = await client.post.create({
      data: {
        question,
        latitude,
        longitude,
        user: {
          connect: {
            id: user?.id,
          },
        },
      },
    });
    return res.status(200).json({
      success: true,
      post: newPost,
    });
  }
}

export default withSessionRoute(
  withHandler({
    methods: ["GET", "POST"],
    handler,
  })
);
