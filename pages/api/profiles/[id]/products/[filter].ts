import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, Record, Review, User } from "@prisma/client";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProfilesDetailProductsResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  products: (Product & {
    user?: Pick<User, "id" | "name" | "photos">;
    records?: Pick<Record, "id" | "kind" | "userId">[];
    chats?: (Chat & { _count: { chatMessages: number } })[];
    reviews?: Pick<Review, "id" | "role" | "sellUserId" | "purchaseUserId">[];
  })[];
}

export const ProfileProductsFilterEnum = {
  ["all"]: "all",
  ["sale"]: "sale",
  ["sold"]: "sold",
} as const;

export type ProfileProductsFilterEnum = typeof ProfileProductsFilterEnum[keyof typeof ProfileProductsFilterEnum];

export const getProfilesDetailProducts = async (query: { filter: ProfileProductsFilterEnum; id: number; prevCursor: number }) => {
  const { filter, id, prevCursor } = query;

  const where = {
    userId: id,
    ...(filter === "all" ? {} : {}),
    ...(filter === "sale" ? { AND: { records: { some: { kind: Kind.ProductSale } } } } : {}),
    ...(filter === "sold" ? { NOT: { records: { some: { kind: Kind.ProductSale } } } } : {}),
  };

  const totalCount = await client.product.count({
    where,
  });

  const products = await client.product.findMany({
    where,
    take: 10,
    skip: prevCursor ? 1 : 0,
    ...(prevCursor && { cursor: { id: prevCursor } }),
    orderBy: {
      resumeAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          photos: true,
        },
      },
      records: {
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
      chats: {
        include: {
          _count: {
            select: {
              chatMessages: true,
            },
          },
        },
      },
      reviews: {
        select: {
          id: true,
          role: true,
          sellUserId: true,
          purchaseUserId: true,
        },
      },
    },
  });

  return {
    totalCount,
    products,
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { filter: _filter, id: _id, prevCursor: _prevCursor } = req.query;

    // invalid
    if (!_filter || !_id || !_prevCursor) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // page
    const filter = _filter.toString() as ProfileProductsFilterEnum;
    const prevCursor = +_prevCursor.toString();
    if (!isInstance(filter, ProfileProductsFilterEnum)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (isNaN(prevCursor) || prevCursor === -1) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const id = +_id.toString();
    if (isNaN(id)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const { totalCount, products } = await getProfilesDetailProducts({ filter, id, prevCursor });

    // result
    const result: GetProfilesDetailProductsResponse = {
      success: true,
      totalCount,
      lastCursor: products.length ? products[products.length - 1].id : -1,
      products,
    };
    return res.status(200).json(result);
  } catch (error: unknown) {
    // error
    if (error instanceof Error) {
      const result = {
        success: false,
        error: {
          timestamp: Date.now().toString(),
          name: error.name,
          message: error.message,
        },
      };
      return res.status(422).json(result);
    }
  }
}

export default withSessionRoute(
  withHandler({
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
