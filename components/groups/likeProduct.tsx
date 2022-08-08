import { useRouter } from "next/router";
import React from "react";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
// @api
import { GetProductsDetailResponse } from "@api/products/[id]";
import { GetProfilesProductsResponse } from "@api/profiles/[id]/products";
import { PostProductsLikeResponse } from "@api/products/[id]/like";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";

export type LikeProductItem = GetProfilesProductsResponse["products"][0];

export interface LikeProductProps extends React.HTMLAttributes<HTMLButtonElement> {
  item?: LikeProductItem;
}

const LikeProduct = ({ item, className }: LikeProductProps) => {
  const router = useRouter();
  const { user, currentAddr } = useUser();
  const { openModal } = useModal();

  const { data, mutate: boundMutate } = useSWR<GetProductsDetailResponse>(item?.id ? `/api/products/${item.id}` : null);
  const [updateLike, { loading: likeLoading }] = useMutation<PostProductsLikeResponse>(`/api/products/${item?.id}/like`, {
    onSuccess: (data) => {
      boundMutate();
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const role = user?.id === item?.userId ? "sellUser" : "purchaseUser";
  const likeRecord = data?.product?.records?.find((record) => record.userId === user?.id && record.kind === Kind.ProductLike);

  // like
  const toggleLike = () => {
    if (!data?.product) return;
    if (likeLoading) return;
    const isLike = !Boolean(likeRecord);
    boundMutate((prev) => {
      let records = prev?.product?.records ? [...prev.product.records] : [];
      const idx = records.findIndex((record) => record.id === likeRecord?.id);
      if (!isLike) records.splice(idx, 1);
      if (isLike) records.push({ id: 0, kind: Kind.ProductLike, userId: user?.id! });
      return prev && { ...prev, product: { ...prev.product, records } };
    }, false);
    updateLike({});
  };

  // modal: welcome
  const openWelcomeModal = () => {
    openModal<MessageModalProps>(MessageModal, "welcome", {
      type: "confirm",
      message: "당근마켓 첫 방문이신가요?",
      cancelBtn: "취소",
      confirmBtn: "당근마켓 시작하기",
      hasBackdrop: true,
      onConfirm: () => {
        router.push("/welcome");
      },
    });
  };

  // modal: sign up
  const openSignUpModal = () => {
    openModal<MessageModalProps>(MessageModal, "signUpNow", {
      type: "confirm",
      message: "휴대폰 인증하고 회원가입하시겠어요?",
      cancelBtn: "취소",
      confirmBtn: "회원가입",
      hasBackdrop: true,
      onConfirm: () => {
        router.push({
          pathname: "/join",
          query: { addrNm: currentAddr?.emdAddrNm },
        });
      },
    });
  };

  if (!item) return null;

  if (!user?.id) {
    return (
      <button className={className} onClick={openWelcomeModal} disabled={likeLoading}>
        <svg className="h-6 w-6 " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button className={className} onClick={user?.id === -1 ? openSignUpModal : toggleLike} disabled={likeLoading}>
      {likeRecord && (
        <svg className="w-6 h-6" fill="currentColor" color="rgb(239 68 68)" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
        </svg>
      )}
      {!likeRecord && (
        <svg className="h-6 w-6 " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  );
};

export default React.memo(LikeProduct, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});