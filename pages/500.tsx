import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
// @libs
import { PageLayout } from "@libs/states";

const Error500: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const [message, setMessage] = useState("");

  const makeMessage = () => {
    if (/^\/products\/\w*$/.test(router.asPath)) return "게시글을 불러올 수 없습니다.";
    if (/^\/stories\/\w*$/.test(router.asPath)) return "게시글을 불러올 수 없습니다.";
    if (/^\/comments\/\w*$/.test(router.asPath)) return "게시글을 불러올 수 없습니다.";
    if (/^\/users\/profiles\/\w*$/.test(router.asPath)) return "프로필을 불러올 수 없습니다.";
    return "500";
  };

  useEffect(() => {
    const currentMessage = makeMessage();

    setMessage(currentMessage);

    setLayout(() => ({
      title: currentMessage,
      header: {
        headerUtils: ["back", "home"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div>
      <h1>Error: {message}</h1>
    </div>
  );
};

export default Error500;
