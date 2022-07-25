import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import useSWR, { SWRConfig } from "swr";
import { Kind } from "@prisma/client";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/users/my";
import { GetChatsDetailResponse } from "@api/chats/[id]";
import { PostChatsMessageResponse } from "@api/chats/[id]/message";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";
import { PostProductsPurchaseResponse } from "@api/products/[id]/purchase";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import SendMessage, { SendMessageTypes } from "@components/forms/sendMessage";
import ChatMessageList from "@components/lists/chatMessageList";
import Product from "@components/cards/product";
import Buttons from "@components/buttons";

const ChatDetail: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();
  const { openModal } = useModal();

  // fetch data: chat detail
  const { data, error, mutate: boundMutate } = useSWR<GetChatsDetailResponse>(router.query.id ? `/api/chats/${router.query.id}` : null, { refreshInterval: 1000, revalidateOnFocus: false });
  const chatUsers = data?.chat?.users ? data.chat.users.filter((chatUser) => chatUser.id !== user?.id) : [];

  const role = user?.id === data?.chat?.product?.userId ? "sellUser" : "purchaseUser";
  const saleRecord = data?.chat?.product?.records?.find((record) => record.kind === Kind.Sale);
  const purchaseRecord = data?.chat?.product?.records?.find((record) => record.kind === Kind.Purchase);
  const existsReview = data?.chat?.product?.reviews?.find((review) => review.role === role && review[`${role}Id`] === user?.id);

  const [updatePurchase, { loading: updatePurchaseLoading }] = useMutation<PostProductsPurchaseResponse>(`/api/products/${router.query.id}/purchase`, {
    onSuccess: (data) => {
      router.push(`/products/${router.query.id}/review`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          break;
      }
    },
  });
  const [updateSale, { loading: saleLoading }] = useMutation<PostProductsSaleResponse>(data?.chat?.product?.id ? `/api/products/${data.chat.product.id}/sale` : "", {
    onSuccess: (data) => {
      if (updatePurchaseLoading) return;
      const purchaseUserId = role === "sellUser" ? chatUsers[0].id : user?.id;
      updatePurchase({ purchase: true, purchaseUserId });
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // chat message form
  const formData = useForm<SendMessageTypes>({});
  const [sendChatMessage, { loading: sendChatMessageLoading }] = useMutation<PostChatsMessageResponse>(`/api/chats/${router.query.id}/message`, {
    onSuccess: (data) => {
      boundMutate();
      window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight });
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const toggleSale = (value: boolean) => {
    if (saleLoading) return;
    if (updatePurchaseLoading) return;
    updateSale({ sale: value });
  };

  const openSoldProductModal = () => {
    if (saleLoading) return;
    if (updatePurchaseLoading) return;
    openModal<MessageModalProps>(MessageModal, "SoldProduct", {
      type: "confirm",
      message:
        role === "sellUser"
          ? `${data?.chat?.product?.user.name}님에게 '${chatUsers[0].name}' 상품을 판매하셨나요?`
          : `${data?.chat?.product?.name}님에게 '${data?.chat?.product?.name}' 상품을 구매하셨나요?`,
      cancelBtn: "취소",
      confirmBtn: role === "sellUser" ? "판매완료" : "구매완료",
      hasBackdrop: true,
      onConfirm: () => {
        toggleSale(false);
      },
    });
  };

  const submitChatMessage = (data: SendMessageTypes) => {
    if (!user || user.id === -1) return;
    if (sendChatMessageLoading) return;
    boundMutate((prev) => {
      const time = new Date();
      const newMessage = { id: time.getTime(), text: data.text, userId: user.id, chatId: 1, createdAt: time, updatedAt: time };
      return (
        prev && {
          ...prev,
          chat: {
            ...prev.chat,
            chatMessages: [...prev.chat.chatMessages, { ...newMessage, user: { id: user.id, name: user.name, avatar: "" } }],
          },
        }
      );
    }, false);
    sendChatMessage(data);
    formData.setValue("text", "");
    window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight });
  };

  useEffect(() => {
    setLayout(() => ({
      title: `${chatUsers.map((chatUser) => chatUser.name).join(", ") || "채팅"}`,
      header: {
        headerUtils: ["back", "title"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, [chatUsers]);

  if (!data) {
    return null;
  }

  return (
    <article className="container pb-20">
      {/* 상품 정보 */}
      {data.chat.product && (
        <div className="-mx-5 sticky top-12 left-0 block py-3 px-5 bg-gray-200">
          <Link href={`/products/${data.chat.product.id}`}>
            <a>
              <Product item={data.chat.product} size="tiny" />
            </a>
          </Link>
          <div className="mt-2 empty:hidden">
            {/* 판매완료, 구매완료 */}
            {saleRecord && (
              <Buttons type="button" text={role === "sellUser" ? "판매완료" : "구매완료"} size="sm" status="default" className="!inline-block !w-auto !text-left" onClick={openSoldProductModal} />
            )}
            {/* 거래 후기 보내기 */}
            {!saleRecord && purchaseRecord && !existsReview && data?.chat.users.find((chatUser) => chatUser.id === purchaseRecord?.userId) && (
              <Link href={`/products/${data?.chat?.product?.id}/review`} passHref>
                <Buttons tag="a" text="거래 후기 보내기" size="sm" status="default" className="!inline-block !w-auto !text-left" />
              </Link>
            )}
            {/* 보낸 후기 보기 */}
            {!saleRecord && purchaseRecord && existsReview && data?.chat.users.find((chatUser) => chatUser.id === existsReview?.[`${role === "sellUser" ? "purchaseUser" : "sellUser"}Id`]) && (
              <Link href={`/reviews/${existsReview.id}`} passHref>
                <Buttons tag="a" text="보낸 후기 보기" size="sm" status="default" className="!inline-block !w-auto !text-left" />
              </Link>
            )}
          </div>
        </div>
      )}
      {/* 채팅 목록 */}
      <div className="mt-2">
        <ChatMessageList list={data.chat.chatMessages} />
      </div>
      {/* 거래 후기 보내기 */}
      {!saleRecord && purchaseRecord && !existsReview && data?.chat.users.find((chatUser) => chatUser.id === purchaseRecord?.userId) && (
        <div className="mt-4 p-3 bg-orange-100 rounded-md">
          {user?.name}님, 거래 잘 하셨나요?
          <br />
          이웃에게 따뜻한 마음을 전해보세요!
          <Link href={`/products/${data?.chat?.product?.id}/review`} passHref>
            <Buttons tag="a" sort="text-link" status="default" text="거래 후기 보내기" />
          </Link>
        </div>
      )}
      {/* 채팅 입력 */}
      <div className="fixed bottom-0 left-0 w-full z-[50]">
        <div className="relative flex items-center mx-auto w-full h-16 max-w-xl border-t bg-white">
          <SendMessage formData={formData} onValid={submitChatMessage} isLoading={sendChatMessageLoading} className="w-full pl-5 pr-3" />
        </div>
      </div>
    </article>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
  getChat: { id: number; response: GetChatsDetailResponse };
}> = ({ getUser, getChat }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [`/api/chats/${getChat.id}`]: getChat.response,
        },
      }}
    >
      <ChatDetail />
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
  // redirect: chats
  if (ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/chats`,
      },
    };
  }

  const chatId = params?.id?.toString();

  // invalid params: chatId
  // redirect: chats
  if (!chatId || isNaN(+chatId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/chats`,
      },
    };
  }

  // find chat
  const chat = await client.chat.findUnique({
    where: {
      id: +chatId,
    },
    include: {
      chatMessages: {
        orderBy: {
          updatedAt: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      product: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          records: {
            where: {
              OR: [{ kind: Kind.Sale }, { kind: Kind.Purchase }],
            },
            select: {
              id: true,
              kind: true,
              userId: true,
            },
          },
        },
      },
    },
  });

  // not found chat
  // redirect: chats
  if (!chat) {
    return {
      redirect: {
        permanent: false,
        destination: `/chats`,
      },
    };
  }

  // not my chat
  // redirect: chats
  if (!chat?.users.find((chatUser) => chatUser.id === ssrUser?.profile?.id)) {
    return {
      redirect: {
        permanent: false,
        destination: `/chats`,
      },
    };
  }

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
      getChat: {
        id: chatId,
        response: {
          success: true,
          chat: JSON.parse(JSON.stringify(chat || [])),
        },
      },
    },
  };
});

export default Page;
