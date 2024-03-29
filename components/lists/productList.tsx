import Link from "next/link";
import type { HTMLAttributes, ReactElement } from "react";
import { Children, cloneElement, isValidElement } from "react";
// @components
import Product, { ProductItem, ProductProps } from "@components/cards/product";
import { FeedbackProductProps } from "@components/groups/feedbackProduct";
import { LikeProductProps } from "@components/groups/likeProduct";
import { HandleProductProps } from "@components/groups/handleProduct";

interface ProductListProps extends HTMLAttributes<HTMLUListElement> {
  list: ProductItem[];
  cardProps?: Partial<ProductProps>;
  children?: ReactElement | ReactElement[];
}

const ProductList = (props: ProductListProps) => {
  const { list, children = null, cardProps = {}, className = "", ...restProps } = props;

  if (!Boolean(list.length)) return null;

  return (
    <ul className={`[&:not(.divide-y-2)]:divide-y [&:not(.border-b-0):not(.border-b-2)]:border-b ${className}`} {...restProps}>
      {list.map((item) => {
        const childrenWithProps = Children.map(children, (child) => {
          if (isValidElement(child)) {
            if (child.key === "LikeProduct") return cloneElement(child as ReactElement<LikeProductProps>, { item, className: "absolute top-3 right-3 p-2" });
            if (child.key === "FeedbackProduct") return <div className="px-5">{cloneElement(child as ReactElement<FeedbackProductProps>, { item })}</div>;
            if (child.key === "HandleProduct") return cloneElement(child as ReactElement<HandleProductProps>, { item });
          }
          return child;
        });
        return (
          <li key={item?.id} className="relative">
            <Link href={`/products/${item?.id}`}>
              <a className="block px-5 py-3.5">
                <Product item={item} {...cardProps} />
              </a>
            </Link>
            {childrenWithProps}
          </li>
        );
      })}
    </ul>
  );
};

export default ProductList;
