import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/users";
import { GetProfilesDetailResponse } from "@api/profiles/[id]";
import { GetProfilesStoriesResponse, ProfilesStoriesFilter } from "@api/profiles/[id]/stories";
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth } from "@api/stories/types";
// @components
import CustomHead from "@components/custom/head";
import StoryList from "@components/lists/storyList";
import CommentSummaryList from "@components/lists/commentSummaryList";

const getKey = (pageIndex: number, previousPageData: GetProfilesStoriesResponse, query: string = "", id: string = "") => {
  if (!id) return null;
  if (pageIndex === 0) return `/api/profiles/${id}/stories?page=1&${query}`;
  if (previousPageData && !previousPageData.stories.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/profiles/${id}/stories?page=${pageIndex + 1}&${query}`;
};

type FilterTab = { index: number; value: ProfilesStoriesFilter; text: string; name: string };

const ProfileStories: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/profiles/${router.query.id}` : null);

  // profile story paging
  const tabs: FilterTab[] = [
    { index: 0, value: "STORY", text: "게시글", name: "등록된 게시글" },
    { index: 1, value: "COMMENT", text: "댓글", name: "등록된 댓글" },
  ];
  const [filter, setFilter] = useState<FilterTab["value"]>(tabs[0].value);
  const activeTab = tabs.find((tab) => tab.value === filter)!;

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });

  const { data, size, setSize } = useSWRInfinite<GetProfilesStoriesResponse>((...arg: [index: number, previousPageData: GetProfilesStoriesResponse]) =>
    getKey(arg[0], arg[1], `filter=${filter}`, router.query.id ? `${router.query.id}` : "")
  );

  const isReachingEnd = data && data?.[data.length - 1].pages > 0 && size > data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const results = {
    stories: data && activeTab.value === "STORY" ? data.flatMap((item) => item.stories) : [],
    comments: data && activeTab.value === "COMMENT" ? data.flatMap((item) => item.comments) : [],
  };

  const changeFilter = (tab: FilterTab) => {
    setFilter(tab.value);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    changeLayout({
      header: {
        title: `${user?.id !== profileData?.profile?.id ? `${profileData?.profile.name}님의 ` : ""}동네생활`,
        titleTag: "h1",
        utils: ["back", "title"],
      },
      navBar: {
        utils: [],
      },
    });
  }, []);

  if (!profileData?.profile) {
    return null;
  }

  return (
    <div className="container">
      <CustomHead title={`동네생활 | ${profileData?.profile.name}님의 당근`} />

      <div className="sticky top-12 left-0 -mx-5 flex bg-white border-b z-[1]">
        {tabs.map((tab) => {
          return (
            <button key={tab.index} type="button" className={`basis-full py-2 text-sm font-semibold ${tab.value === filter ? "text-black" : "text-gray-500"}`} onClick={() => changeFilter(tab)}>
              {tab.text}
            </button>
          );
        })}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform"
          style={{ width: `${100 / tabs.length}%`, transform: `translateX(${100 * activeTab.index}%)` }}
        />
      </div>

      {/* 게시글: List */}
      {Boolean(activeTab.value === "STORY" ? results.stories.length : activeTab.value === "COMMENT" ? results.comments.length : 0) && (
        <div className="-mx-5">
          {activeTab.value === "STORY" && <StoryList list={results.stories} />}
          {activeTab.value === "COMMENT" && <CommentSummaryList list={results.comments} />}
          <div ref={infiniteRef} />
          <div className="px-5 py-6 text-center border-t">
            <span className="text-sm text-gray-500">{isLoading ? `${activeTab?.name}을 모두 확인하였어요` : isReachingEnd ? `${activeTab?.name}을 불러오고있어요` : ""}</span>
          </div>
        </div>
      )}

      {/* 게시글: Empty */}
      {!Boolean(activeTab.value === "STORY" ? results.stories.length : activeTab.value === "COMMENT" ? results.comments.length : 0) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">{`${activeTab?.name}이 존재하지 않아요`}</p>
        </div>
      )}
    </div>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
  getProfile: { response: GetProfilesDetailResponse };
  getStories: { query: string; response: GetProfilesStoriesResponse };
  getComments: { query: string; response: GetProfilesStoriesResponse };
}> = ({ getUser, getProfile, getStories, getComments }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users": getUser.response,
          [`/api/profiles/${getProfile.response.profile.id}`]: getProfile.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesStoriesResponse]) => getKey(arg[0], arg[1], getStories.query, `${getProfile.response.profile.id}`))]: [
            getStories.response,
          ],
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesStoriesResponse]) => getKey(arg[0], arg[1], getComments.query, `${getProfile.response.profile.id}`))]: [
            getComments.response,
          ],
        },
      }}
    >
      <ProfileStories />
    </SWRConfig>
  );
};

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // getProfile
  const profileId = params?.id?.toString();

  // invalid params: profileId
  // redirect: /profiles/[id]
  if (!profileId || isNaN(+profileId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}`,
      },
    };
  }

  // find profile
  const profile = await client.user.findUnique({
    where: {
      id: +profileId,
    },
  });

  // not found profile
  // redirect: /profiles/[id]
  if (!profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}`,
      },
    };
  }

  // find story
  const stories = await client.story.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      userId: profile.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      records: {
        where: {
          kind: Kind.StoryLike,
        },
        select: {
          id: true,
          kind: true,
          emotion: true,
          userId: true,
        },
      },
      comments: {
        where: {
          depth: {
            gte: StoryCommentMinimumDepth,
            lte: StoryCommentMaximumDepth,
          },
          NOT: [{ content: "" }],
        },
        select: {
          id: true,
        },
      },
    },
  });

  // find comments
  const comments = await client.storyComment.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      userId: profile.id,
      NOT: [{ content: "" }],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      records: {
        where: {
          kind: Kind.CommentLike,
        },
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
      story: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

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
      getProfile: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(profile || {})),
        },
      },
      getStories: {
        query: `filter=STORY`,
        response: {
          success: true,
          stories: JSON.parse(JSON.stringify(stories || [])),
          pages: 0,
        },
      },
      getComments: {
        query: `filter=COMMENT`,
        response: {
          success: true,
          comments: JSON.parse(JSON.stringify(comments || [])),
          pages: 0,
        },
      },
    },
  };
});

export default Page;