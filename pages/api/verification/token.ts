import { NextApiRequest, NextApiResponse } from "next";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostVerificationTokenResponse extends ResponseDataType {}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { token, key } = req.body;

    // invalid
    if (!token || !key) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const foundToken = await client.token.findUnique({
      where: {
        payload: token,
      },
    });
    if (!foundToken) {
      const error = new Error("인증번호를 다시 확인해주세요.");
      error.name = "InvalidToken";
      throw error;
    }

    // delete token
    await client.token.deleteMany({
      where: {
        userId: foundToken.userId,
      },
    });

    // if (/\/account\/login$/.test(referer) || /\/account\/join?.*$/.test(referer) || /\/account\/phone$/.test(referer)) {
    //   // update user
    //   req.session.user = {
    //     id: foundToken.userId,
    //   };
    //   delete req.session.dummyUser;
    //   await req.session.save();
    // }

    // result
    const result: PostVerificationTokenResponse = {
      success: true,
    };
    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      const date = Date.now().toString();
      const result = {
        success: false,
        error: {
          timestamp: date,
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
    methods: [{ type: "POST", isPrivate: false }],
    handler,
  })
);
