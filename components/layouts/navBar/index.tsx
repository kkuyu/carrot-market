import { useRouter } from "next/router";
import Link from "next/link";

import { useRecoilValue } from "recoil";

import { NavBarUtils, PageLayout } from "@libs/states";

export interface NavBarProps {
  navBarUtils?: NavBarUtils[];
}

const NavBar = ({}: NavBarProps) => {
  const router = useRouter();
  const {
    navBar: { navBarUtils },
  } = useRecoilValue(PageLayout);

  const classNames = {
    default: "flex flex-col items-center space-y-1",
    active: "text-orange-500",
    inactive: "hover:text-gray-500 transition-colors",
  };

  const getUtils = (name: NavBarUtils) => {
    switch (name) {
      case "community":
        return (
          <Link href="/community">
            <a className={`${classNames.default} ${router.pathname === "/community" ? classNames.active : classNames.inactive}`}>
              <svg className="m-auto w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                ></path>
              </svg>
              <span className="block text-sm text-center">동네생활</span>
            </a>
          </Link>
        );
      case "home":
        return (
          <Link href="/">
            <a className={`${classNames.default} ${router.pathname === "/" ? classNames.active : classNames.inactive}`}>
              <svg className="m-auto w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                ></path>
              </svg>
              <span className="block text-sm text-center">홈</span>
            </a>
          </Link>
        );
      case "inbox":
        return (
          <Link href="/inbox">
            <a className={`${classNames.default} ${router.pathname === "/inbox" ? classNames.active : classNames.inactive}`}>
              <svg className="m-auto w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                ></path>
              </svg>
              <span className="block text-sm text-center">채팅</span>
            </a>
          </Link>
        );
      case "profile":
        return (
          <Link href="/profile">
            <a className={`${classNames.default} ${router.pathname === "/profile" ? classNames.active : classNames.inactive}`}>
              <svg className="m-auto w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span className="block text-sm text-center">나의 당근</span>
            </a>
          </Link>
        );
      case "streams":
        return (
          <Link href="/streams">
            <a className={`${classNames.default} ${router.pathname === "/streams" ? classNames.active : classNames.inactive}`}>
              <svg className="m-auto w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                ></path>
              </svg>
              <span className="block text-sm text-center">스트리밍</span>
            </a>
          </Link>
        );
      default:
        return null;
    }
  };

  if (!navBarUtils.length) {
    return null;
  }

  return (
    <div id="layout-nav-bar" className="fixed bottom-0 left-0 w-full z-[100]">
      <nav className="mx-auto w-full h-16 max-w-xl border-t bg-white">
        <div className="-mb-1 flex items-center justify-around w-full h-full">
          {navBarUtils.includes(NavBarUtils["Home"]) && <>{getUtils(NavBarUtils["Home"])}</>}
          {navBarUtils.includes(NavBarUtils["Community"]) && <>{getUtils(NavBarUtils["Community"])}</>}
          {navBarUtils.includes(NavBarUtils["Inbox"]) && <>{getUtils(NavBarUtils["Inbox"])}</>}
          {navBarUtils.includes(NavBarUtils["Streams"]) && <>{getUtils(NavBarUtils["Streams"])}</>}
          {navBarUtils.includes(NavBarUtils["Profile"]) && <>{getUtils(NavBarUtils["Profile"])}</>}
        </div>
      </nav>
    </div>
  );
};

export default NavBar;