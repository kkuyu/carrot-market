import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import useSWR from "swr";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import client from "@libs/server/client";
// @api
import { ProfilesConcern } from "@api/users/profiles/types";
import { GetProfilesDetailResponse } from "@api/users/profiles/[id]";
// @components
import Profiles from "@components/profiles";
import MannerList from "@components/lists/mannerList";
import ReviewList from "@components/lists/reviewList";
import Buttons from "@components/buttons";

const ProfileDetail: NextPage<{
  staticProps: {
    profile: GetProfilesDetailResponse["profile"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  // view model
  const [viewModel, setViewModel] = useState({
    mode: !user?.id ? "preview" : user?.id !== staticProps?.profile?.id ? "public" : "private",
  });

  // static data: profile detail
  const [profile, setProfile] = useState<GetProfilesDetailResponse["profile"] | null>(staticProps?.profile ? staticProps.profile : null);

  // fetch data: profile detail
  const { data, error } = useSWR<GetProfilesDetailResponse>(router.query.id && profile ? `/api/users/profiles/${router.query.id}` : null);

  // merge data
  useEffect(() => {
    if (!data) return;
    if (!data.success) return;
    setProfile((prev) => ({
      ...prev,
      ...data.profile,
    }));
  }, [data]);

  // setting layout
  useEffect(() => {
    if (!profile) return;

    const mode = !user?.id ? "preview" : user?.id !== profile?.id ? "public" : "private";
    setViewModel({ mode });

    setLayout(() => ({
      title: "프로필",
      seoTitle: `${profile?.name || ""} | 프로필`,
      header: {
        headerUtils: ["back", "title", "home", "share"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, [user?.id, profile?.id]);

  if (!profile) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className="container pt-5 pb-5">
      <h1>
        <Profiles user={profile} uuid={profile?.id === -1 ? "" : `#${profile?.id}`} />
      </h1>

      {/* 관심사 */}
      {(viewModel.mode === "private" || profile?.concerns) && (
        <div className="mt-3">
          <strong className="block">{viewModel.mode === "private" ? "나의 관심사" : "관심사"}</strong>
          {profile?.concerns && (
            <div>
              {ProfilesConcern.filter((concern) => profile?.concerns?.includes(concern.value)).map((concern) => (
                <span key={concern.value} className="inline-block mt-2 mr-2 px-2 py-1.5 text-sm border rounded-lg">
                  {concern.emoji} {concern.text}
                </span>
              ))}
            </div>
          )}
          {!profile?.concerns && <p className="mt-1 text-gray-500">이웃에게 나를 표현해보세요</p>}
        </div>
      )}

      {/* 프로필 수정 */}
      {viewModel.mode === "private" && (
        <Link href="/users/profiles/edit" passHref>
          <Buttons tag="a" text="프로필 수정" size="sm" status="default" className="mt-3" />
        </Link>
      )}

      {/* todo: 매너온도 */}

      {/* 정보 */}
      <div className="-mx-5 mt-5 border-t">
        <ul className="divide-y">
          <li>
            <Link href={`/users/profiles/${profile.id}/products`}>
              <a className="block py-3">
                <span className="block-arrow font-semibold">판매상품{data?.profile?._count?.products ? ` ${data.profile._count.products}개` : ""}</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="">
              <a className="block py-3">
                <span className="block-arrow font-semibold">동네생활</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href={`/users/profiles/${profile.id}/manners`}>
              <a className="block py-3">
                <span className="block-arrow font-semibold">받은 매너 평가</span>
                {data && Boolean(data?.manners?.length) && (
                  <div className="mt-3 px-5">
                    <MannerList list={data.manners} />
                  </div>
                )}
              </a>
            </Link>
          </li>
          <li>
            <Link href={`/users/profiles/${profile.id}/reviews`}>
              <a className="block py-3">
                <span className="block-arrow font-semibold">받은 매너 후기</span>
              </a>
            </Link>
            {data && Boolean(data?.reviews?.length) && (
              <div className="px-5">
                <ReviewList list={data?.reviews} />
              </div>
            )}
          </li>
        </ul>
      </div>
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
  const profileId = params?.id?.toString();

  // invalid params: profileId
  // redirect: /
  if (!profileId || isNaN(+profileId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  // find profile
  const profile = await client.user.findUnique({
    where: {
      id: +profileId,
    },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  // not found profile
  // 404
  if (!profile) {
    return {
      notFound: true,
    };
  }

  // initial props
  return {
    props: {
      staticProps: {
        profile: JSON.parse(JSON.stringify(profile || {})),
      },
    },
  };
};

export default ProfileDetail;
