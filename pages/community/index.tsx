import type { NextPage } from "next";
import { useRouter } from "next/router";

import { useEffect, useRef } from "react";
import { useSetRecoilState } from "recoil";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";

import { PageLayout } from "@libs/states";
import { GetPostsResponse } from "@api/posts";
import { GetUserResponse } from "@api/users/my";

import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import FloatingButtons from "@components/floatingButtons";
import { PostList, PostItem } from "@components/lists";
import { PostPostsCuriosityResponse } from "@api/posts/[id]/curiosity";

const getKey = (pageIndex: number, previousPageData: GetPostsResponse, query: string = "") => {
  if (pageIndex === 0) return `/api/posts?page=1&${query}`;
  if (previousPageData && !previousPageData.posts.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/posts?page=${pageIndex + 1}&${query}`;
};

const Community: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();
  const { openModal } = useModal();

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });
  const { data, size, setSize, mutate } = useSWRInfinite<GetPostsResponse>((...arg: [index: number, previousPageData: GetPostsResponse]) =>
    getKey(arg[0], arg[1], currentAddr.emdPosNm ? `posX=${currentAddr.emdPosX}&posY=${currentAddr.emdPosY}&distance=${currentAddr.emdPosDx}` : "")
  );

  const isReachingEnd = data && size === data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const posts = data ? data.flatMap((item) => item.posts) : [];

  const curiosityItem = async (item: PostItem) => {
    if (!data) return;
    const mutateData = data.map((dataRow) => {
      const posts = dataRow.posts.map((post) => {
        if (post.id !== item.id) return post;
        return {
          ...post,
          isCuriosity: !post.isCuriosity,
          _count: {
            ...post._count,
            curiosities: post.isCuriosity ? post._count.curiosities - 1 : post._count.curiosities + 1,
          },
        };
      });
      return { ...dataRow, posts };
    });
    mutate(mutateData, false);
    const updateCuriosity: PostPostsCuriosityResponse = await (await fetch(`/api/posts/${item.id}/curiosity`, { method: "POST" })).json();
    if (updateCuriosity.error) console.error(updateCuriosity.error);
    mutate();
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
        router.replace(`/join?addrNm=${currentAddr?.emdAddrNm}`);
      },
    });
  };

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    setLayout(() => ({
      seoTitle: "동네생활",
      header: {
        headerUtils: ["address", "search"],
      },
      navBar: {
        navBarUtils: ["community", "home", "inbox", "profile", "streams"],
      },
    }));
  }, []);

  return (
    <div className="container">
      {/* 동네생활 목록 */}
      <div className="-mx-5">
        {posts.length ? (
          <>
            <PostList list={posts || []} pathname="/community/[id]" curiosityItem={user.id === -1 ? openSignUpModal : curiosityItem} />
            <div ref={infiniteRef} className="py-6 text-center border-t">
              <span className="text-sm text-gray-500">{isLoading ? "게시글을 불러오고있어요" : isReachingEnd ? "게시글을 모두 확인하였어요" : ""}</span>
            </div>
          </>
        ) : (
          <div className="py-10 text-center">
            <p className="text-gray-500">
              앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
              <br />
              등록된 게시글이 없어요.
            </p>
          </div>
        )}
      </div>

      {/* 동네생활 글쓰기 */}
      <FloatingButtons href="/community/write">
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </FloatingButtons>
    </div>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
  getPost: { query: string; response: GetPostsResponse };
}> = ({ getUser, getPost }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetPostsResponse]) => getKey(arg[0], arg[1], getPost.query))]: [getPost.response],
        },
      }}
    >
      <Community />
    </SWRConfig>
  );
};

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const profile = req?.session?.user?.id
    ? await client.user.findUnique({
        where: { id: req?.session?.user?.id },
      })
    : null;
  const dummyProfile = !profile ? req?.session?.dummyUser : null;

  // getPost
  const posX = profile?.[`${profile.emdType}_emdPosX`] || dummyProfile?.MAIN_emdPosX || null;
  const posY = profile?.[`${profile.emdType}_emdPosY`] || dummyProfile?.MAIN_emdPosY || null;
  const distance = profile?.[`${profile.emdType}_emdPosDx`] || dummyProfile?.MAIN_emdPosDx || null;
  const query = `posX=${posX}&posY=${posY}&distance=${distance}`;

  const posts =
    !posX || !posY || !distance
      ? []
      : await client.post.findMany({
          take: 10,
          skip: 0,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          where: {
            emdPosX: { gte: posX - distance, lte: posX + distance },
            emdPosY: { gte: posY - distance, lte: posY + distance },
          },
        });

  return {
    props: {
      getUser: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(profile)),
          dummyProfile: JSON.parse(JSON.stringify(dummyProfile)),
        },
      },
      getPost: {
        query,
        response: {
          success: true,
          posts: JSON.parse(JSON.stringify(posts)),
          pages: 0,
        },
      },
    },
  };
});

export default Page;
