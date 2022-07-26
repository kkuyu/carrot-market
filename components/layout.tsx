import React from "react";
import Head from "next/head";

import { cls } from "@libs/utils";

import Header from "@components/header";
import TabNav from "@components/tabNav";

interface LayoutProps {
  seoTitle?: string;
  title?: string;
  hasBackBtn?: boolean;
  hasHeadBar?: boolean;
  hasTabBar?: boolean;
  children: React.ReactNode;
}

export default function Layout({ seoTitle, title, hasBackBtn, hasHeadBar = true, hasTabBar = false, children }: LayoutProps) {
  return (
    <div>
      <Head>
        <title>{seoTitle || title ? `${seoTitle || title}  | Carrot Market` : "Carrot Market"}</title>
      </Head>
      {hasHeadBar && <Header title={title} hasBackBtn={hasBackBtn} />}
      <div className={cls("main", hasHeadBar ? "pt-12" : "", hasTabBar ? "pb-16" : "")}>{children}</div>
      {hasTabBar && <TabNav />}
    </div>
  );
}
