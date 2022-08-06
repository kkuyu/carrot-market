import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import NextError from "next/error";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
// @libs
import { getCommentTree, truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetCommentsDetailResponse } from "@api/comments/[id]";
import { PostStoriesCommentsResponse } from "@api/stories/[id]/comments";
// @components
import CustomHead from "@components/custom/head";
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import Comment from "@components/cards/comment";
import CommentTreeList from "@components/lists/commentTreeList";
import FeedbackComment from "@components/groups/feedbackComment";
import HandleComment from "@components/groups/handleComment";
import EditComment, { EditCommentTypes } from "@components/forms/editComment";
import StorySummary from "@components/cards/storySummary";
import Link from "next/link";

const CommentsDetail: NextPage<{
  staticProps: {
    comment: GetCommentsDetailResponse["comment"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const { user, currentAddr } = useUser();
  const { changeLayout } = useLayouts();
  const { openModal } = useModal();

  // comment detail
  const [comment, setComment] = useState<GetCommentsDetailResponse["comment"] | null>(staticProps?.comment ? staticProps.comment : null);
  const [commentLoading, setCommentLoading] = useState(false);
  const treeReComments = useMemo(() => {
    if (!comment?.reComments?.length) return [];
    return getCommentTree(Math.max(...comment?.reComments.map((v) => v.depth)), [{ ...comment, reComments: [] }, ...comment?.reComments.map((v) => ({ ...v, reComments: [] }))]);
  }, [comment]);
  const [commentsQuery, setCommentsQuery] = useState("");
  const { data, mutate: mutateCommentDetail } = useSWR<GetCommentsDetailResponse>(router?.query?.id ? `/api/comments/${router.query.id}?includeReComments=true&${commentsQuery}` : null);

  // new comment
  const formData = useForm<EditCommentTypes>();
  const [sendComment, { loading: sendCommentLoading }] = useMutation<PostStoriesCommentsResponse>(`/api/stories/${comment?.storyId}/comments`, {
    onSuccess: (successData) => {
      setComment((prev) => prev && { ...prev, reComments: prev?.reComments?.map((comment) => (comment.id !== 0 ? comment : { ...comment, id: successData.comment.id })) || [] });
      setCommentsQuery(() => `exists=${JSON.stringify(comment?.reComments?.map((comment) => comment.id))}`);
      setCommentLoading(() => false);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const moreReComments = (page: number, reCommentRefId: number, cursorId: number) => {
    const existComments = page !== 0 ? comment?.reComments : comment?.reComments?.filter((comment) => comment.reCommentRefId !== reCommentRefId);
    setComment((prev) => prev && { ...prev, reComments: existComments?.length ? [...existComments] : [] });
    setCommentsQuery(() => {
      let result = "";
      result += `exists=${JSON.stringify(existComments?.map((comment) => comment.id))}`;
      result += `&page=${page}&reCommentRefId=${reCommentRefId}`;
      result += cursorId !== -1 ? `&cursorId=${cursorId}` : "";
      return result;
    });
  };

  const submitReComment = (data: EditCommentTypes) => {
    if (commentLoading || sendCommentLoading) return;
    if (!user) return;
    if (!comment) return;
    setCommentLoading(() => true);
    mutateCommentDetail((prev) => {
      const time = new Date();
      const { content, reCommentRefId = null } = data;
      const dummyAddr = { emdAddrNm: "", emdPosNm: "", emdPosDx: 0, emdPosX: 0, emdPosY: 0 };
      const dummyComment = { id: 0, depth: comment?.depth + 1, content, reCommentRefId, userId: user?.id, storyId: comment?.storyId, createdAt: time, updatedAt: time };
      return prev && { ...prev, comment: { ...prev.comment, reComments: [...(prev?.comment?.reComments || []), { ...dummyComment, user, ...dummyAddr }] } };
    }, false);
    formData.setValue("content", "");
    sendComment({ ...data, ...currentAddr });
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
        router.push(`/join?addrNm=${currentAddr?.emdAddrNm}`);
      },
    });
  };

  // merge data
  useEffect(() => {
    if (!data) return;
    if (!data.success) {
      router.push(`/stories/${comment?.storyId}`);
      return;
    }
    setComment((prev) => ({
      ...prev,
      ...data.comment,
    }));
  }, [data]);

  useEffect(() => {
    if (router?.query?.id === comment?.id?.toString()) return;
    setCommentsQuery(() => "");
  }, [router?.query?.id, comment?.id]);

  // setting layout
  useEffect(() => {
    if (!comment) return;

    changeLayout({
      header: {
        title: "댓글",
        titleTag: 'strong',
        utils: ["back", "title"],
      },
      navBar: {
        utils: [],
      },
    });
  }, [user?.id, comment?.id, comment?.content]);

  // focus
  useEffect(() => {
    if (!comment) return;
    formData.setValue("reCommentRefId", comment.id);
    (document.querySelector(".container input#comment") as HTMLInputElement)?.focus();
  }, [comment?.id]);

  if (!comment) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className={`container ${user?.id ? "pb-20" : "pb-5"}`}>
      <CustomHead title={`${truncateStr(comment?.content, 15)} | 댓글`} />
      <h1 className="sr-only">{truncateStr(comment?.content, 15)} | 댓글</h1>

      {comment?.story && (
        <Link href={`/stories/${comment.story.id}`}>
          <a className="block -mx-5 px-5 py-3 bg-gray-200">
            <StorySummary item={comment?.story} />
          </a>
        </Link>
      )}
      <div className="relative mt-5">
        <Comment item={comment} className={user?.id ? "pr-8" : ""} />
        <FeedbackComment item={comment} />
        {user?.id && <HandleComment item={comment} mutateCommentDetail={mutateCommentDetail} />}
      </div>
      {/* 답글 목록: list */}
      {Boolean(treeReComments?.[0]?.reComments?.length) && (
        <div className="mt-2">
          <CommentTreeList list={treeReComments?.[0]?.reComments} moreReComments={moreReComments} depth={comment.depth + 1}>
            <FeedbackComment key="FeedbackComment" />
            {user?.id && <HandleComment key="HandleComment" mutateCommentDetail={mutateCommentDetail} />}
            <CommentTreeList key="CommentTreeList" />
          </CommentTreeList>
        </div>
      )}
      {/* 답글 입력 */}
      {user?.id && (
        <div className="fixed bottom-0 left-0 w-full z-[50]">
          <div className="relative flex items-center mx-auto w-full h-16 max-w-screen-sm border-t bg-white">
            <EditComment
              type="post"
              formData={formData}
              onValid={user?.id === -1 ? openSignUpModal : submitReComment}
              isLoading={commentLoading || sendCommentLoading}
              commentType="답글"
              className="w-full pl-5 pr-3"
            />
          </div>
        </div>
      )}
    </article>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const commentId = params?.id?.toString();

  // invalid params: commentId
  if (!commentId || isNaN(+commentId)) {
    return {
      notFound: true,
    };
  }

  // find comment
  const comment = await client.storyComment.findUnique({
    where: {
      id: +commentId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      story: {
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
      records: {
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
      _count: {
        select: {
          reComments: true,
        },
      },
    },
  });

  // not found comment
  // 404
  if (!comment) {
    return {
      notFound: true,
    };
  }
  if (comment.depth < StoryCommentMinimumDepth) {
    return {
      notFound: true,
    };
  }
  if (comment.depth > StoryCommentMaximumDepth) {
    return {
      notFound: true,
    };
  }

  const reComments = await client.storyComment.findMany({
    where: {
      storyId: comment.storyId,
      reCommentRefId: comment.id,
      depth: comment.depth + 1,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      story: {
        select: {
          id: true,
          userId: true,
          category: true,
        },
      },
      _count: {
        select: {
          reComments: true,
        },
      },
      reComments: {
        take: 2,
        orderBy: {
          createdAt: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          story: {
            select: {
              id: true,
              userId: true,
              category: true,
            },
          },
          _count: {
            select: {
              reComments: true,
            },
          },
        },
      },
    },
  });

  // initial props
  return {
    props: {
      staticProps: {
        comment: JSON.parse(JSON.stringify({ ...comment, reComments: reComments.map(({ reComments, ...o }) => o).concat(reComments.flatMap((o) => o.reComments)) } || null)),
      },
    },
  };
};

export default CommentsDetail;