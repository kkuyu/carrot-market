import Link from "next/link";

import { getDiffTimeStr } from "@libs/utils";

import { GetPostsResponse } from "@api/posts";
import { ThumbnailList, ThumbnailItem } from "@components/lists";

export type PostItem = GetPostsResponse["posts"][0];

interface PostsProps {
  list: GetPostsResponse["posts"];
  pathname: string;
  curiosityItem: (item: PostItem) => void;
}

const Posts = ({ list, pathname, curiosityItem }: PostsProps) => {
  const today = new Date();

  if (!list.length) {
    return null;
  }

  return (
    <ul className="divide-y">
      {list.map((item) => {
        const diffTime = getDiffTimeStr(new Date(item?.updatedAt).getTime(), today.getTime());
        const thumbnails: ThumbnailItem[] = (item?.photo ? item.photo.split(",") : []).map((src, index, array) => ({
          src,
          index,
          key: `thumbnails-list-${item.id}-${index + 1}`,
          label: `${index + 1}/${array.length}`,
          name: `게시글 이미지 ${index + 1}/${array.length} (${item?.question?.length > 15 ? item?.question?.substring(0, 15) + "..." : item?.question})`,
        }));

        return (
          <li key={item?.id}>
            <Link href={{ pathname, query: { id: item?.id } }}>
              <a className="block pt-5 pb-5 px-5">
                <div>
                  {/* todo: 카테고리 */}
                  <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">동네생활</em>
                  <strong className="mt-2 block font-normal">{item?.question}</strong>
                </div>

                <div className="mt-2 flex justify-between">
                  <span className="text-sm text-gray-500">
                    {item?.user?.name} · {item?.emdPosNm}
                  </span>
                  <span className="text-sm text-gray-500">{diffTime}</span>
                </div>
              </a>
            </Link>

            {Boolean(thumbnails.length) && (
              <div className="mb-5 px-5">
                <ThumbnailList
                  list={thumbnails || []}
                  modal={{
                    title: `게시글 이미지 (${item?.question?.length > 15 ? item?.question?.substring(0, 15) + "..." : item?.question})`,
                  }}
                />
              </div>
            )}

            <div className="px-5 border-t">
              <button type="button" className="py-2" onClick={() => curiosityItem(item)}>
                <svg
                  className={`inline-block w-5 h-5 ${item.isCuriosity ? "text-orange-500" : "text-gray-500"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className={`ml-1 text-sm ${item.isCuriosity ? "text-orange-500" : "text-gray-500"}`}>궁금해요 {item?._count?.curiosities || null}</span>
              </button>
              <Link href={{ pathname, query: { id: item?.id } }}>
                <a className="ml-4 py-2">
                  <svg className="inline-block w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    ></path>
                  </svg>
                  <span className="ml-1 text-sm text-gray-500">댓글 {item?._count?.comments || null}</span>
                </a>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default Posts;
