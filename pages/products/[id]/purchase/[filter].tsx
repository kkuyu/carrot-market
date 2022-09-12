import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useState } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { getKey, getPostposition, isInstance, truncateStr } from "@libs/utils";
import useMutation from "@libs/client/useMutation";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetProductsDetailResponse, getProductsDetail } from "@api/products/[id]";
import { GetProductsChatsResponse, ChatsFilterEnum, getProductsChats } from "@api/products/[id]/chats/[filter]";
import { PostProductsPurchaseResponse } from "@api/products/[id]/purchase";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ProductSummary from "@components/cards/productSummary";
import ChatList from "@components/lists/chatList";
import Buttons from "@components/buttons";

const ProductsPurchasePage: NextPage = () => {
  const router = useRouter();

  // variable data: invisible
  const [isValidProduct, setIsValidProduct] = useState(true);
  const chatTypes: { key: string; isInfinite: boolean; filter: ChatsFilterEnum; caption: string; partnerName: string }[] = [
    { key: "chat", isInfinite: true, filter: "all", caption: "최근 채팅", partnerName: "최근 채팅한 이웃" },
    { key: "chat", isInfinite: true, filter: "available", caption: "대화중인 채팅", partnerName: "대화중인 이웃" },
  ];
  const currentType = chatTypes.find((type) => type.filter === router?.query?.filter?.toString())!;

  // fetch data
  const { data: productData, mutate: mutateProduct } = useSWR<GetProductsDetailResponse>(router?.query?.id ? `/api/products/${router?.query?.id}?` : null);
  const { data, setSize, mutate } = useSWRInfinite<GetProductsChatsResponse>((...arg: [index: number, previousPageData: GetProductsChatsResponse]) => {
    const options = { url: router?.query?.id && currentType.filter ? `/api/products/${router?.query?.id}/chats/${currentType.filter}` : "", query: "" };
    return getKey<GetProductsChatsResponse>(...arg, options);
  });

  // mutation data
  const [updateProductPurchase, { loading: loadingProductPurchase }] = useMutation<PostProductsPurchaseResponse>(`/api/products/${router?.query?.id}/purchase`, {
    onSuccess: async () => {
      await mutateProduct();
      await router.replace(`/products/${router?.query?.id}/review`);
    },
  });

  // variable data: visible
  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const chats = data ? data.flatMap((item) => item.chats) : null;

  // update: Record.Kind.ProductPurchase
  const purchaseItem = (item: GetProductsChatsResponse["chats"][number], chatUser: GetProductsChatsResponse["chats"][number]["users"]) => {
    if (loadingProductPurchase) return;
    if (!chatUser.length || chatUser.length > 1) console.error("purchaseItem", chatUser);
    updateProductPurchase({ purchase: true, purchaseUserId: chatUser[0].id });
  };

  // update: isValidProduct
  useEffect(() => {
    const isInvalid = {
      user: !(productData?.productCondition?.role?.myRole === "sellUser"),
      product: productData?.productCondition?.isSale,
      sentReview: productData?.productCondition?.isPurchase && productData?.productCondition?.review?.sentReviewId,
      receiveReview: productData?.productCondition?.review?.receiveReviewId,
    };
    // invalid
    if (!productData?.success || !productData?.product || Object.values(isInvalid).includes(true)) {
      setIsValidProduct(false);
      const productId = router?.query?.id?.toString();
      let redirectDestination = null;
      if (!redirectDestination && isInvalid.sentReview) redirectDestination = `/products/reviews/${productData?.productCondition?.review?.sentReviewId}`;
      if (!redirectDestination && isInvalid.receiveReview) redirectDestination = `/products/${productId}/review`;
      router.replace(redirectDestination ?? `/products/${productId}`);
      return;
    }
    // valid
    setIsValidProduct(true);
  }, [productData]);

  // update: infinite list
  useEffect(() => {
    if (isVisible && !isReachingEnd) setSize((size) => size + 1);
  }, [isVisible, isReachingEnd]);

  // reload: infinite list
  useEffect(() => {
    (async () => {
      if (!data?.[0].success && router.query.id) await mutate();
    })();
  }, [data, router.query.id]);

  if (!isValidProduct) {
    return <NextError statusCode={500} />;
  }

  return (
    <div className="">
      {/* 제품정보 */}
      {productData?.product && currentType.filter === "available" && (
        <Link href={`/products/${productData?.product.id}`}>
          <a className="block px-5 py-3 bg-gray-200">
            <ProductSummary item={productData?.product} {...(productData?.productCondition ? { condition: productData?.productCondition } : {})} />
          </a>
        </Link>
      )}

      {/* 구매자 선택 */}
      <div className="container [&:not(:first-child)]:mt-5 pb-5">
        {currentType.filter === "available" && (
          <strong className="text-lg">
            판매가 완료되었어요
            <br />
            구매자를 선택해주세요
          </strong>
        )}

        {/* 채팅 목록: List */}
        {chats && Boolean(chats.length) && (
          <>
            <ChatList
              list={chats}
              isVisibleSingleUser={true}
              cardProps={{ isVisibleProduct: false, isVisibleLastChatMessage: false }}
              selectItem={purchaseItem}
              className="-mx-5 border-b [&:not(:first-child)]:mt-5 [&:not(:first-child)]:border-t"
            />
            <span className="empty:hidden list-loading">
              {isReachingEnd ? `${getPostposition(currentType.caption, "을;를")} 모두 확인하였어요` : isLoading ? `${currentType.caption}을 불러오고있어요` : null}
            </span>
          </>
        )}

        {/* 채팅 목록: Empty */}
        {chats && !Boolean(chats.length) && (
          <p className="list-empty">
            <>{getPostposition(currentType.caption, "이;가")}이 없어요</>
          </p>
        )}

        {/* 채팅 목록: InfiniteRef */}
        <div id="infiniteRef" ref={infiniteRef} />

        {/* 구매자 찾기 */}
        {chats && (!Boolean(chats.length) || isReachingEnd) && (
          <div className="text-center">
            <Link href={`/products/${router.query.id}/purchase/${chatTypes.find((type) => type.filter !== currentType.filter)?.filter!}`} passHref>
              <Buttons tag="a" sort="text-link" size="sm" status="default">
                {`${chatTypes.find((type) => type.filter !== currentType.filter)?.caption!}에서 구매자 찾기`}
              </Buttons>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getProductsDetail: { options: { url: string; query: string }; response: GetProductsDetailResponse };
  getProductsChats: { options: { url: string; query: string }; response: GetProductsChatsResponse };
}> = ({ getUser, getProductsDetail, getProductsChats }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [`${getProductsDetail?.options?.url}?${getProductsDetail?.options?.query}`]: getProductsDetail.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProductsChatsResponse]) => getKey<GetProductsChatsResponse>(...arg, getProductsChats.options))]: [
            getProductsChats.response,
          ],
        },
      }}
    >
      <ProductsPurchasePage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // params
  const filter = (params?.filter?.toString() as ChatsFilterEnum) || "";
  const productId = params?.id?.toString() || "";

  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // invalidFilter
  // redirect `/products/${productId}/purchase/available`,
  if (!filter || !isInstance(filter, ChatsFilterEnum)) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}/purchase/available`,
      },
    };
  }

  // invalidUser
  // redirect `/products/${productId}`
  if (!ssrUser.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // getProductsDetail
  const productsDetail =
    productId && !isNaN(+productId)
      ? await getProductsDetail({
          id: +productId,
          userId: ssrUser?.profile?.id,
        })
      : {
          product: null,
          productCondition: null,
        };
  if (!productsDetail?.product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  const isInvalid = {
    user: !(productsDetail?.productCondition?.role?.myRole === "sellUser"),
    product: productsDetail?.productCondition?.isSale,
    sentReview: productsDetail?.productCondition?.isPurchase && productsDetail?.productCondition?.review?.sentReviewId,
    receiveReview: productsDetail?.productCondition?.review?.receiveReviewId,
  };

  // isInvalid
  // redirect: redirectDestination ?? `/products/${productId}`,
  if (Object.values(isInvalid).includes(true)) {
    let redirectDestination = null;
    if (!redirectDestination && isInvalid.sentReview) redirectDestination = `/products/reviews/${productsDetail?.productCondition?.review?.sentReviewId}`;
    if (!redirectDestination && isInvalid.receiveReview) redirectDestination = `/products/${productId}/review`;
    return {
      redirect: {
        permanent: false,
        destination: redirectDestination ?? `/products/${productId}`,
      },
    };
  }

  // getProductsChats
  const productsChats = ssrUser?.profile?.id
    ? await getProductsChats({
        id: +productId,
        filter,
        prevCursor: 0,
        userId: ssrUser?.profile?.id,
      })
    : {
        totalCount: 0,
        chats: [],
      };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `구매자 선택 | ${truncateStr(productsDetail?.product?.name, 15)} | 중고거래`,
    },
    header: {
      title: "구매자 선택",
      titleTag: "h1",
      utils: ["back", "title"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getUser: {
        options: {
          url: "/api/user",
          query: "",
        },
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getProductsDetail: {
        options: {
          url: `/api/products/${productId}`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(productsDetail || {})),
        },
      },
      getProductsChats: {
        options: {
          url: `/api/products/${productId}/chats/${filter}`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(productsChats || {})),
        },
      },
    },
  };
});

export default Page;
