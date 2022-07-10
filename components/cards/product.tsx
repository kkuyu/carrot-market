import Image from "next/image";

import { getDiffTimeStr } from "@libs/utils";
import { GetProductsResponse } from "@api/products";

export type ProductItem = GetProductsResponse["products"][0];

interface ProductProps {
  item: ProductItem;
}

const Product = ({ item }: ProductProps) => {
  const today = new Date();
  const thumbnailId = item?.photo ? item.photo.split(",")[0] : "";
  const diffTime = getDiffTimeStr(new Date(item.updatedAt).getTime(), today.getTime());

  return (
    <div className="relative">
      <div className="flex items-start">
        <div className="relative flex-none w-24 border border-gray-200 bg-slate-300 overflow-hidden rounded-md">
          <div className="pb-[100%]" />
          {thumbnailId ? (
            <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${thumbnailId}/public`} alt="" layout="fill" objectFit="cover" />
          ) : (
            <svg className="absolute top-1/2 left-1/2 -mt-4 -ml-4 w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              ></path>
            </svg>
          )}
        </div>
        <div className="grow pl-4">
          <strong className="block font-normal">{item?.name}</strong>
          <span className="block text-sm text-gray-500">
            {item?.emdPosNm} · {diffTime}
          </span>
          <span className="block mt-2 pr-8 font-semibold">₩{item?.price}</span>
        </div>
      </div>
      <div className="absolute bottom-5 right-5">
        {Boolean(item?.records?.length) && (
          <div className="flex items-center space-x-0.5 text-sm text-gray-400">
            <svg className="flex-none w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              ></path>
            </svg>
            <span>{item?.records?.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Product;