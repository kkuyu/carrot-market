import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useSetRecoilState } from "recoil";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetChatsResponse } from "@api/chats";
import { GetUserResponse } from "@api/users/my";
import { GetProductsDetailResponse } from "@api/products/[id]";
// @components
import Product from "@components/cards/product";
import Chat from "@components/cards/chat";

const getKey = (pageIndex: number, previousPageData: GetChatsResponse, query: string = "") => {
  if (pageIndex === 0) return `/api/chats?page=1&${query}`;
  if (previousPageData && !previousPageData.chats.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/chats?page=${pageIndex + 1}&${query}`;
};

const ProductChats: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });
  const { data, size, setSize } = useSWRInfinite<GetChatsResponse>((...arg: [index: number, previousPageData: GetChatsResponse]) =>
    getKey(arg[0], arg[1], router.query.id ? `productId=${router.query.id}` : "")
  );
  const { data: productData } = useSWR<GetProductsDetailResponse>(router.query.id ? `/api/products/${router.query.id}` : null);

  const isReachingEnd = data && size >= data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const chats = data ? data.flatMap((item) => item.chats) : [];

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    setLayout(() => ({
      title: "대화 중인 채팅방",
      header: {
        headerUtils: ["back", "title"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container">
      {/* 제품정보 */}
      <Link href={`/products/${productData?.product.id}`}>
        <a className="block -mx-5 px-5 py-3 bg-gray-200">
          <Product item={productData?.product!} size="tiny" />
        </a>
      </Link>

      {/* 채팅: List */}
      {Boolean(chats.length) && (
        <div className="-mx-5">
          <ul className="divide-y">
            {chats
              .filter((item) => item.chatMessages.length)
              .map((item) => {
                const users = item.users.filter((chatUser) => chatUser.id !== user?.id);
                const usersThumbnail = users.length === 1 ? users[0].avatar || "" : "";
                return (
                  <li key={item.id}>
                    <Link href={`/chats/${item.id}`}>
                      <a className="block px-5 py-3">
                        <Chat item={item} users={users} usersThumbnail={usersThumbnail} />
                      </a>
                    </Link>
                  </li>
                );
              })}
          </ul>
          <div className="py-6 text-center border-t">
            <span className="text-sm text-gray-500">{isLoading ? "채팅을 불러오고있어요" : isReachingEnd ? "채팅을 모두 확인하였어요" : ""}</span>
          </div>
        </div>
      )}

      {/* 채팅: Empty */}
      {!Boolean(chats.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">채팅한 이웃이 없어요.</p>
        </div>
      )}

      {/* infiniteRef */}
      <div ref={infiniteRef} />
    </div>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
  getProduct: { response: GetProductsDetailResponse };
  getChat: { query: string; response: GetChatsResponse };
}> = ({ getUser, getProduct, getChat }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [`/api/products/${getProduct.response.product.id}`]: getProduct.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetChatsResponse]) => getKey(arg[0], arg[1], getChat.query))]: [getChat.response],
        },
      }}
    >
      <ProductChats />
    </SWRConfig>
  );
};

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // redirect: welcome
  if (!ssrUser.profile && !ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/welcome`,
      },
    };
  }

  const productId = params?.id?.toString();

  // invalid params: productId
  if (!productId || isNaN(+productId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  // find product
  const product = await client.product.findUnique({
    where: {
      id: +productId,
    },
    include: {
      records: {
        where: {
          OR: [{ kind: Kind.Sale }],
        },
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
    },
  });

  // invalid product: not found
  // redirect: /products/id
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // find chat
  const chats = ssrUser.profile
    ? await client.chat.findMany({
        take: 10,
        skip: 0,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
            },
          },
          chatMessages: {
            take: 1,
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
        where: {
          users: {
            some: {
              id: ssrUser.profile?.id,
            },
          },
          productId: product.id,
        },
      })
    : [];

  return {
    props: {
      getUser: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(ssrUser.profile || {})),
          dummyProfile: JSON.parse(JSON.stringify(ssrUser.dummyProfile || {})),
          currentAddr: JSON.parse(JSON.stringify(ssrUser.currentAddr || {})),
        },
      },
      getProduct: {
        response: {
          success: true,
          product: JSON.parse(JSON.stringify(product || [])),
        },
      },
      getChat: {
        query: `productId=${product.id}`,
        response: {
          success: true,
          chats: JSON.parse(JSON.stringify(chats || [])),
          pages: 0,
        },
      },
    },
  };
});

export default Page;
