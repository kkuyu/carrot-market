import type { GetServerSideProps, NextPage, NextPageContext } from "next";
import Link from "next/link";
import Image from "next/image";

import useSWR, { SWRConfig } from "swr";

import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import useUser from "@libs/client/useUser";
import { User } from "@prisma/client";
import { GetReviewsResponse } from "@api/reviews";

import { cls } from "@libs/utils";
import Layout from "@components/layout";

const Profile: NextPage = () => {
  const { user } = useUser();

  const { data } = useSWR<GetReviewsResponse>("/api/reviews");

  return (
    <Layout hasTabBar title="My carrot">
      <div className="container pt-5 pb-5">
        <div>
          <button className="flex items-center w-full space-x-3 text-left">
            {user?.avatar ? (
              <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${user?.avatar}/avatar`} alt="" className="flex-none w-16 h-16 bg-slate-500 rounded-full" />
            ) : (
              <div className="flex-none w-16 h-16 bg-slate-500 rounded-full" />
            )}
            <div>
              <strong className="block font-semibold text-gray-900">{user?.name}</strong>
              <Link href="/profile/edit">
                <a className="text-sm text-gray-700">Edit profile &rarr;</a>
              </Link>
            </div>
          </button>
        </div>
        <div className="mt-10">
          <div className="flex justify-around">
            <Link href="/profile/sold">
              <a className="flex flex-col items-center">
                <div className="flex items-center justify-center w-14 h-14 text-white bg-orange-500 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                </div>
                <span className="mt-2 text-sm font-semibold text-gray-700">Sold</span>
              </a>
            </Link>
            <Link href="/profile/bought">
              <a className="flex flex-col items-center">
                <div className="flex items-center justify-center w-14 h-14 text-white bg-orange-500 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                </div>
                <span className="mt-2 text-sm font-semibold text-gray-700">Bought</span>
              </a>
            </Link>
            <Link href="/profile/loved">
              <a className="flex flex-col items-center">
                <div className="flex items-center justify-center w-14 h-14 text-white bg-orange-500 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    ></path>
                  </svg>
                </div>
                <span className="mt-2 text-sm font-semibold text-gray-700">Loved</span>
              </a>
            </Link>
          </div>
        </div>
        <div className="mt-12">
          <h3 className="font-semibold text-gray-900">Reviews</h3>
          <div className="divide-y">
            {data?.reviews.map((review) => (
              <div className="py-5" key={review.id}>
                <div className="flex items-center w-full space-x-3 text-left">
                  <div className="flex-none w-12 h-12 bg-slate-400 rounded-full" />
                  <div>
                    <strong className="text-sm font-semibold text-gray-700">{review.createdBy.name}</strong>
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <span className="sr-only">{`Star: ${review.score}`}</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={cls("h-5 w-5", review.score >= star ? "text-yellow-400" : "text-gray-400")}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <p>{review.review}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const Page: NextPage<{ profile: User }> = ({ profile }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": {
            success: true,
            profile,
          },
        },
      }}
    >
      <Profile />
    </SWRConfig>
  );
};

export const getServerSideProps = withSsrSession(async ({ req }) => {
  const profile = await client.user.findUnique({
    where: {
      id: req?.session.user?.id,
    },
  });
  return {
    props: {
      profile: JSON.parse(JSON.stringify(profile)),
    },
  };
});

export default Page;
