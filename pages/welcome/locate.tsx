import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
// @libs
import useLayouts from "@libs/client/useLayouts";
import useCoords from "@libs/client/useCoords";
// @api
import { GetBoundarySearchResponse } from "@api/address/boundary-search";
import { GetKeywordSearchResponse } from "@api/address/keyword-search";
// @pages
import type { NextPageWithLayout } from "@pages/_app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";
import SearchAddress, { SearchAddressTypes } from "@components/forms/searchAddress";

const WelcomeLocate: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();
  const { state, longitude, latitude } = useCoords();

  const [keyword, setKeyword] = useState("");
  const searchAddressForm = useForm<SearchAddressTypes>();
  const { data: keywordData, error: keywordError } = useSWR<GetKeywordSearchResponse>(Boolean(keyword.length) ? `/api/address/keyword-search?keyword=${keyword}` : null);
  const { data: boundaryData, error: boundaryError } = useSWR<GetBoundarySearchResponse>(
    longitude && latitude ? `/api/address/boundary-search?distance=${0.02}&posX=${longitude}&posY=${latitude}` : null
  );

  const resetForm = () => {
    setKeyword("");
    searchAddressForm.setValue("keyword", "");
    searchAddressForm.setFocus("keyword");
  };

  const selectItem = (itemData: GetBoundarySearchResponse["emdList"][0] | GetKeywordSearchResponse["emdList"][0]) => {
    router.push({
      pathname: "/join",
      query: { addrNm: itemData?.addrNm },
    });
  };

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container pb-5">
      {/* 읍면동 검색 폼 */}
      <div className="sticky top-12 left-0 -mx-5 px-5 pt-5 bg-white">
        <SearchAddress
          formData={searchAddressForm}
          onValid={(data: SearchAddressTypes) => {
            setKeyword(data.keyword);
          }}
          onReset={resetForm}
          keyword={keyword}
        />
        <span className="absolute top-full left-0 w-full h-2 bg-gradient-to-b from-white" />
      </div>

      {/* 키워드 검색 결과 */}
      {Boolean(keyword.length) && (
        <div className="mt-1">
          {!keywordData && !keywordError ? (
            // 로딩중
            <div className="py-2 text-center">
              <span className="text-gray-500">검색 결과를 불러오고있어요</span>
            </div>
          ) : keywordData?.emdList.length ? (
            // 검색결과 목록
            <ul className="divide-y">
              {keywordData.emdList.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => selectItem(item)} className="block w-full py-2 text-left">
                    {item.addrNm}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            // 검색결과 없음
            <div className="py-2 text-center">
              <p className="text-gray-500">
                검색 결과가 없어요.
                <br />
                동네 이름을 다시 확인해주세요!
              </p>
              <Buttons tag="button" type="button" sort="text-link" text="동네 이름 다시 검색하기" onClick={resetForm} className="mt-2" />
            </div>
          )}
        </div>
      )}

      {/* 위치 검색 결과 */}
      {!Boolean(keyword.length) && (
        <div className="mt-1">
          {state === "denied" || state === "error" ? (
            // 위치 정보 수집 불가
            <div className="py-2 text-center">
              <span className="text-gray-500">
                위치 정보를 요청할 수 없어요.
                <br />
                내 위치를 확인하도록 허용하거나
                <br />
                동네 이름을 검색해 주세요!
              </span>
            </div>
          ) : !boundaryData && !boundaryError ? (
            // 로딩중
            <div className="py-2 text-center">
              <span className="text-gray-500">검색 결과를 불러오고있어요</span>
            </div>
          ) : boundaryData?.emdList.length ? (
            // 검색결과 목록
            <ul className="divide-y">
              {boundaryData.emdList.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => selectItem(item)} className="block w-full py-2 text-left">
                    {item.addrNm}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            // 검색결과 없음
            <div className="py-2 text-center">
              <p className="text-gray-500">
                검색 결과가 없어요.
                <br />
                동네 이름을 검색해 주세요!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Page: NextPageWithLayout = () => {
  return <WelcomeLocate />;
};

Page.getLayout = getLayout;

export const getStaticProps: GetStaticProps = async () => {
  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "내 동네 설정하기",
    },
    header: {
      title: "내 동네 설정하기",
      titleTag: "h1",
      utils: ["back", "title"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
    },
  };
};

export default Page;
