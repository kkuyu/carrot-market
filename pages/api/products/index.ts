import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    const { page } = req.query;
    const cleanPage = +page?.toString()!;

    const displayRow = 10;
    const totalPageCount = await client.product.count();
    const products = await client.product.findMany({
      take: displayRow,
      skip: (cleanPage - 1) * displayRow,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        records: {
          where: {
            kind: "Favorite",
          },
          select: {
            id: true,
          },
        },
      },
    });
    if (!products) {
      return res.status(200).json({
        success: true,
        products: [],
        pages: 1,
      });
    }
    return res.status(200).json({
      success: true,
      products,
      pages: Math.ceil(totalPageCount / displayRow),
    });
  }
  if (req.method === "POST") {
    const { name, price, description, photoId } = req.body;
    const { user } = req.session;
    if (!name && !price && !description) {
      const error = new Error("Invalid request body");
      throw error;
    }
    const newProduct = await client.product.create({
      data: {
        photo: photoId,
        name,
        price,
        description,
        user: {
          connect: {
            id: user?.id,
          },
        },
      },
    });
    return res.status(200).json({
      success: true,
      product: newProduct,
    });
  }
}

export default withSessionRoute(
  withHandler({
    methods: ["GET", "POST"],
    handler,
  })
);
