import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
import { Kind } from "@prisma/client";
// @libs
import { getDiffTimeStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetProductsDetailResponse } from "@api/products/[id]";
import { PostProductsUpdateResponse } from "@api/products/[id]/update";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";
import ProductSummary from "@components/cards/productSummary";
import ResumeProduct, { ResumeProductTypes } from "@components/forms/resumeProduct";

const ProductsResumePage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  const [state, setState] = useState<"HoldOff" | "MaxCount" | "ReadyFreeProduct" | "ReadyPayProduct" | null>(null);
  const { data: productData } = useSWR<GetProductsDetailResponse>(router?.query?.id ? `/api/products/${router.query.id}` : null);

  const today = new Date();
  const targetDate = (() => {
    let target: Date | null = null;
    let nextTarget: Date | null = null;
    if (!productData?.product) {
      return [target, nextTarget];
    }
    if (productData?.product?.resumeCount < 15) {
      target = new Date(productData?.product?.resumeAt);
      target.setDate(target.getDate() + (2 + productData?.product?.resumeCount));
    }
    if (target && productData?.product?.resumeCount + 1 < 15) {
      nextTarget = target.toISOString().replace(/T.*$/, "") > today.toISOString().replace(/T.*$/, "") ? new Date(target) : new Date(today);
      nextTarget.setDate(nextTarget.getDate() + (2 + productData?.product?.resumeCount));
    }
    return [target, nextTarget];
  })();
  const diffTime = (() => {
    const target = !targetDate[0] ? "" : getDiffTimeStr(today.getTime(), targetDate[0].getTime(), { suffixStr: " 후" });
    const nextTarget = !targetDate[1] ? "" : getDiffTimeStr(today.getTime(), targetDate[1].getTime() + 1000 * 60 * 60 * 24, { suffixStr: " 후" });
    return [target, nextTarget];
  })();

  const formData = useForm<ResumeProductTypes>({
    defaultValues: {
      price: productData?.product?.price,
    },
  });

  const [editProduct, { loading }] = useMutation<PostProductsUpdateResponse>(`/api/products/${router.query.id}/update`, {
    onSuccess: (data) => {
      router.replace(`/profiles/${data.product.userId}/products`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const submitProduct = () => {
    if (!user || loading) return;
    editProduct({
      resume: true,
      price: formData.getValues("price"),
    });
  };

  useEffect(() => {
    if (!productData?.product) return;
    setState(() => {
      if (targetDate[0] === null) return "MaxCount";
      if (today > targetDate[0]) return productData?.product?.price === 0 ? "ReadyFreeProduct" : "ReadyPayProduct";
      if (today < targetDate[0]) return "HoldOff";
      return null;
    });
    formData.setValue("price", productData?.product?.price);
  }, [productData, user?.id]);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  if (!productData?.product) return null;
  if (state === null) return null;

  return (
    <div className="container pb-5">
      {/* 제품정보 */}
      <Link href={`/products/${productData?.product?.id}`}>
        <a className="block -mx-5 px-5 py-3 bg-gray-200">
          <ProductSummary item={productData?.product} />
        </a>
      </Link>

      {/* 끌어올리기: HoldOff */}
      {state === "HoldOff" && (
        <div className="mt-5">
          <strong className="text-lg">
            <span className="text-orange-500">{diffTime[0]}에</span>
            <br />
            끌어올릴 수 있어요
          </strong>
          <p className="mt-5">
            {user?.name}님, 혹시 판매가 잘 안되시나요?
            <br />
            판매 꿀팁을 확인하고 판매 확률을 높여보세요.
            <br />
            <br />
            {/* todo: 판매 확률 높이는 꿀팁보기 */}
            <Link href="" passHref>
              <Buttons tag="a" sort="text-link" text="판매 확률 높이는 꿀팁보기" status="default" className="pl-0" />
            </Link>
          </p>
          <Buttons tag="button" type="button" text="끌어올리기" className="mt-5" disabled={true} />
        </div>
      )}

      {/* 끌어올리기: MaxCount */}
      {state === "MaxCount" && (
        <div className="mt-5">
          <strong className="text-lg">
            <span className="text-orange-500">게시글당 최대 15번</span> 끌어올릴 수 있어요
            <br />
            이 게시글은 이미 15번을 모두 사용해서
            <br />
            더이상 끌어올릴 수 없어요
          </strong>
          <p className="mt-5">
            {user?.name}님, 혹시 판매가 잘 안되시나요?
            <br />
            판매 꿀팁을 확인하고 판매 확률을 높여보세요.
            <br />
            <br />
            {/* todo: 판매 확률 높이는 꿀팁보기 */}
            <Link href="" passHref>
              <Buttons tag="a" sort="text-link" text="판매 확률 높이는 꿀팁보기" status="default" className="pl-0" />
            </Link>
          </p>
          <Buttons tag="button" type="button" text="끌어올리기" className="mt-5" disabled={true} />
        </div>
      )}

      {/* 끌어올리기: ReadyFreeProduct */}
      {state === "ReadyFreeProduct" && (
        <div className="mt-5">
          <strong className="text-lg">지금 끌어올리시겠어요?</strong>
          {targetDate[1] && (
            <p className="mt-5">
              다음 끌어올리기는 <span className="text-orange-500">{diffTime[1]}</span>에 할 수 있어요
            </p>
          )}
          <Buttons tag="button" type="submit" text="끌어올리기" className="mt-5" disabled={loading} onClick={submitProduct} />
        </div>
      )}

      {/* 끌어올리기: ReadyPayProduct */}
      {state === "ReadyPayProduct" && (
        <div className="mt-5">
          <strong className="text-lg">
            {user?.name}님, 끌어올리기 전에
            <br />
            가격을 낮춰보세요
          </strong>
          <div className="mt-5">
            <ResumeProduct formData={formData} onValid={submitProduct} isLoading={loading} originalPrice={productData?.product?.price} targetDate={targetDate} diffTime={diffTime} />
          </div>
        </div>
      )}
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProduct: { response: GetProductsDetailResponse };
}> = ({ getUser, getProduct }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/products/${getProduct.response.product.id}`]: getProduct.response,
        },
      }}
    >
      <ProductsResumePage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // productId
  const productId: string = params?.id?.toString() || "";

  // invalidUser
  let invalidUser = false;
  if (!ssrUser.profile) invalidUser = true;
  // redirect `/products/${productId}`
  if (invalidUser) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // invalidUrl
  let invalidUrl = false;
  if (!productId || isNaN(+productId)) invalidUrl = true;
  // redirect `/products/${productId}`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // getProduct
  const product = await client.product.findUnique({
    where: {
      id: +productId,
    },
    include: {
      records: {
        where: {
          OR: [{ kind: Kind.ProductSale }],
        },
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
    },
  });

  // invalidProduct
  let invalidProduct = false;
  if (!product) invalidProduct = true;
  if (product?.userId !== ssrUser?.profile?.id) invalidProduct = true;
  // redirect `/products/${productId}`
  if (invalidProduct) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // condition
  const role = ssrUser?.profile?.id === product?.userId ? "sellUser" : "purchaseUser";
  const saleRecord = product?.records?.find((record) => record.kind === Kind.ProductSale);

  // invalidCondition
  let invalidCondition = false;
  if (!saleRecord) invalidCondition = true;
  // redirect `/products/${productId}`
  if (invalidCondition) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "끌어올리기 | 중고거래",
    },
    header: {
      title: "끌어올리기",
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
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getProduct: {
        response: {
          success: true,
          product: JSON.parse(JSON.stringify(product || {})),
        },
      },
    },
  };
});

export default Page;
