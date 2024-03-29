import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import { getCommentTree, truncateStr, submitFiles } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
import useTimeDiff from "@libs/client/useTimeDiff";
// @api
import { GetStoriesDetailResponse, getStoriesDetail } from "@api/stories/[id]";
import { GetStoriesCommentsResponse, PostStoriesCommentsResponse, getStoriesComments } from "@api/stories/[id]/comments";
import { PostStoriesDeleteResponse } from "@api/stories/[id]/delete";
import { PostStoriesViewsResponse } from "@api/stories/[id]/views";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import { ActionStyleEnum } from "@components/commons/modals/case/actionModal";
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";
import PictureList from "@components/groups/pictureList";
import FeedbackStory from "@components/groups/feedbackStory";
import FeedbackComment from "@components/groups/feedbackComment";
import HandleComment from "@components/groups/handleComment";
import ArticleReport from "@components/groups/articleReport";
import EditStoryComment, { EditStoryCommentTypes } from "@components/forms/editStoryComment";
import CommentTreeList from "@components/lists/commentTreeList";
import Profiles from "@components/profiles";

const StoriesDetailPage: NextPage = () => {
  const router = useRouter();
  const { user, currentAddr, type: userType } = useUser();
  const { changeLayout } = useLayouts();
  const { openModal } = useModal();

  // variable: invisible
  const [commentQuery, setCommentQuery] = useState("");

  // fetch data
  const { data: storyData, mutate: mutateStoryDetail } = useSWR<GetStoriesDetailResponse>(router.query.id ? `/api/stories/${router.query.id}?` : null);
  const { data: commentData, mutate: mutateStoryComments } = useSWR<GetStoriesCommentsResponse>(router.query.id ? `/api/stories/${router.query.id}/comments?${commentQuery}` : null);

  // mutation data
  const [createStoryComment, { loading: loadingComment }] = useMutation<PostStoriesCommentsResponse>(`/api/stories/${router.query.id}/comments`, {
    onSuccess: async () => {
      await mutateStoryDetail();
      await mutateStoryComments();
    },
  });
  const [deleteStory, { loading: loadingStory }] = useMutation<PostStoriesDeleteResponse>(`/api/stories/${router.query.id}/delete`, {
    onSuccess: async () => {
      router.replace("/stories");
    },
  });

  // variable: form
  const formData = useForm<EditStoryCommentTypes>({ defaultValues: { reCommentRefId: null } });

  // variable: visible
  const { isMounted, timeState } = useTimeDiff(storyData?.story?.createdAt?.toString() || null);

  // variable: comments
  const [flatComments, setFlatComments] = useState<GetStoriesCommentsResponse["comments"]>(() => {
    if (!commentData?.comment) return [];
    return commentData?.comments;
  });
  const { treeComments, loadingComments } = useMemo(() => {
    const treeComments = getCommentTree(Math.max(...flatComments.map((v) => v.depth)), [...flatComments.map((v) => ({ ...v, reComments: [] }))]);
    return { treeComments, loadingComments: !!flatComments.find((comment) => comment.id === 0) };
  }, [flatComments]);

  // update: StoryComment
  const submitStoryComment = (data: EditStoryCommentTypes) => {
    if (!user || loadingComment || loadingComments) return;
    if (!storyData?.story) return;
    mutateStoryDetail((prev) => {
      return prev && { ...prev, story: { ...prev.story, comments: [...(prev.story.comments || []), { id: 0 }] } };
    }, false);
    mutateStoryComments((prev) => {
      const time = new Date();
      const { content, reCommentRefId = null } = data;
      const dummyAddr = { emdAddrNm: "", emdPosNm: "", emdPosDx: 0, emdPosX: 0, emdPosY: 0 };
      const dummyComment = { ...data, id: 0, depth: 0, content, reCommentRefId, userId: user?.id, storyId: storyData?.story?.id, createdAt: time, updatedAt: time };
      return prev && { ...prev, comments: [...prev.comments, { ...dummyComment, user, ...dummyAddr }] };
    }, false);
    formData.setValue("content", "");
    createStoryComment({ ...data, ...currentAddr });
  };

  // modal: ConfirmDeleteStory
  const openDeleteModal = () => {
    openModal<AlertModalProps>(AlertModal, "ConfirmDeleteStory", {
      message: "삭제하시겠어요?",
      actions: [
        {
          key: "cancel",
          style: AlertStyleEnum["cancel"],
          text: "취소",
          handler: null,
        },
        {
          key: "destructive",
          style: AlertStyleEnum["destructive"],
          text: "삭제",
          handler: () => {
            if (loadingStory) return;
            submitFiles([], { ...(storyData?.story?.photos?.length ? { originalPaths: storyData?.story?.photos?.split(";") } : {}) });
            deleteStory({});
          },
        },
      ],
    });
  };

  // update: flatComments
  useEffect(() => {
    setFlatComments((prev) => [...(commentData?.comments || prev)]);
  }, [commentData?.comments]);

  // update: commentQuery
  useEffect(() => {
    if (!router?.query?.id) return;
    setCommentQuery("");
  }, [router?.query?.id]);

  // change: layout
  useEffect(() => {
    if (!userType) return;
    const kebabActions = [
      { key: "welcome", style: ActionStyleEnum["primary"], text: "당근마켓 시작하기", handler: () => router.push(`/welcome`) },
      { key: "edit", style: ActionStyleEnum["default"], text: "수정", handler: () => router.push(`/stories/${storyData?.story?.id}/edit`) },
      { key: "block", style: ActionStyleEnum["default"], text: "이 사용자의 글 보지 않기", handler: () => console.log("이 사용자의 글 보지 않기") },
      { key: "report", style: ActionStyleEnum["destructive"], text: "신고", handler: () => console.log("신고") },
      { key: "delete", style: ActionStyleEnum["destructive"], text: "삭제", handler: () => openDeleteModal() },
      { key: "cancel", style: ActionStyleEnum["cancel"], text: "취소", handler: null },
    ];
    changeLayout({
      header: {
        kebabActions:
          userType === "guest"
            ? kebabActions.filter((action) => ["welcome", "cancel"].includes(action.key))
            : user?.id !== storyData?.story?.userId
            ? kebabActions.filter((action) => ["report", "block", "cancel"].includes(action.key))
            : kebabActions.filter((action) => ["edit", "delete", "cancel"].includes(action.key)),
      },
    });
  }, [storyData?.story, user?.id, userType]);

  if (!storyData?.success || !storyData?.story) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className={`container pt-5 ${userType !== "guest" ? "pb-16" : "pb-5"}`}>
      <h1 className="sr-only">{truncateStr(storyData?.story?.content, 15)} | 동네생활</h1>

      {/* 게시글 정보 */}
      <section className="border-b">
        {/* 카테고리 */}
        <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">{storyData?.storyCondition?.category?.text}</em>
        {/* 판매자 */}
        {storyData?.story?.user && (
          <Link href={`/profiles/${storyData?.story?.user?.id}`}>
            <a className="block py-3.5">
              <Profiles user={storyData?.story?.user} emdPosNm={storyData?.story?.emdPosNm} diffTime={isMounted && timeState.diffStr ? timeState.diffStr : ""} size="sm" />
            </a>
          </Link>
        )}
        {/* 게시글 내용 */}
        <div className="pt-5 border-t">
          <p className="whitespace-pre-wrap">{storyData?.story?.content}</p>
        </div>
        {/* 썸네일 */}
        {Boolean(storyData?.story?.photos?.length) && (
          <div className="mt-4">
            <PictureList
              list={
                storyData?.story?.photos?.split(";")?.map((src, index, array) => ({
                  src,
                  index,
                  key: `thumbnails-slider-${index + 1}`,
                  label: `${index + 1}/${array.length}`,
                  name: `게시글 이미지 ${index + 1}/${array.length} (${truncateStr(storyData?.story?.content, 15)})`,
                })) || []
              }
            />
          </div>
        )}
        <ArticleReport<PostStoriesViewsResponse>
          fetchUrl={isMounted && storyData?.story ? `/api/stories/${storyData?.story?.id}/views` : null}
          initialState={{ id: storyData?.story?.id, views: storyData?.story?.views }}
          className="empty:hidden mt-4"
        />
        {/* 피드백 */}
        <FeedbackStory item={storyData?.story} className="mt-3" />
      </section>

      {/* 댓글/답변 목록: list */}
      {isMounted && treeComments && Boolean(treeComments?.length) && (
        <div className="mt-5">
          <CommentTreeList
            list={treeComments}
            prefix={storyData.story.id.toString()}
            cardProps={{ className: `${userType === "member" ? "pr-8" : ""}` }}
            moreReComments={(readType, reCommentRefId, prevCursor) => {
              const comments = readType === "more" ? flatComments : flatComments.filter((comment) => comment.reCommentRefId !== reCommentRefId);
              setFlatComments(() => comments);
              setCommentQuery(() => `existed=${JSON.stringify(comments?.map((comment) => comment.id))}&readType=${readType}&reCommentRefId=${reCommentRefId}&prevCursor=${prevCursor}`);
            }}
          >
            <FeedbackComment key="FeedbackComment" />
            {userType === "member" ? <HandleComment key="HandleComment" className="p-1" mutateStoryDetail={mutateStoryDetail} mutateStoryComments={mutateStoryComments} /> : <></>}
            <CommentTreeList key="CommentTreeList" />
          </CommentTreeList>
        </div>
      )}

      {/* 댓글/답변 목록: empty */}
      {isMounted && treeComments && !Boolean(treeComments?.length) && (
        <div className="list-empty">
          <>
            아직 {storyData?.storyCondition?.category?.commentType}이 없어요
            <br />
            가장 먼저 {storyData?.storyCondition?.category?.commentType}을 남겨보세요
          </>
        </div>
      )}

      {/* 댓글/답변 입력 */}
      {userType !== "guest" && (
        <div className="fixed-container bottom-0 z-[50]">
          <div className="fixed-inner flex items-center h-14 border-t bg-white">
            <EditStoryComment
              formType="create"
              formData={formData}
              onValid={(data) => (userType === "member" ? submitStoryComment(data) : openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {}))}
              isLoading={loadingComment || loadingComments}
              commentType={storyData?.storyCondition?.category?.commentType}
              className="w-full px-5"
            />
          </div>
        </div>
      )}
    </article>
  );
};

const Page: NextPageWithLayout<{
  getStoriesDetail: { options: { url: string; query: string }; response: GetStoriesDetailResponse };
  getStoriesComments: { options: { url: string; query: string }; response: GetStoriesCommentsResponse };
}> = ({ getStoriesDetail, getStoriesComments }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          ...(getStoriesDetail
            ? {
                [`${getStoriesDetail?.options?.url}?${getStoriesDetail?.options?.query}`]: getStoriesDetail.response,
                [`${getStoriesComments?.options?.url}?${getStoriesComments?.options?.query}`]: getStoriesComments.response,
              }
            : {}),
        },
      }}
    >
      <StoriesDetailPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // params
  const storyId = params?.id?.toString() || "";

  // getStoriesDetail
  const storiesDetail =
    storyId && !isNaN(+storyId)
      ? await getStoriesDetail({
          id: +storyId,
        })
      : {
          story: null,
          storyCondition: null,
        };
  if (!storiesDetail?.story) {
    return {
      notFound: true,
    };
  }

  // getStoriesComments
  const storiesComments = storiesDetail?.story?.id
    ? await getStoriesComments({
        storyId: storiesDetail?.story?.id,
        existed: [],
        readType: null,
        reCommentRefId: 0,
        prevCursor: 0,
      })
    : {
        comments: [],
      };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${truncateStr(storiesDetail?.story?.content, 15)} | 동네생활`,
    },
    header: {
      title: "",
      titleTag: "strong",
      utils: ["back", "title", "home", "share", "kebab"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getStoriesDetail: {
        options: {
          url: `/api/stories/${storyId}`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(storiesDetail || {})),
        },
      },
      getStoriesComments: {
        options: {
          url: `/api/stories/${storyId}/comments`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(storiesComments || {})),
        },
      },
    },
  };
};

export default Page;
