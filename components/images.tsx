import Image from "next/image";
import type { HTMLAttributes } from "react";
import { useEffect, useState } from "react";
// @components
import Icons from "@components/icons";

interface ImagesProps extends HTMLAttributes<HTMLDivElement> {
  alt: string;
  size?: string;
  ratioX?: number;
  ratioY?: number;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  cloudId?: string | null | undefined;
  cloudVariant?: string;
}

const Images = (props: ImagesProps) => {
  const { alt = "", size = "3.5rem", ratioX = 1, ratioY = 1, rounded = "full", cloudId: _cloudId, cloudVariant = "public", className = "", ...restProps } = props;

  const [mounted, setMounted] = useState(false);
  const [cloudId, setCloudId] = useState<string | null>(null);

  const onError = () => {
    setCloudId(null);
  };

  useEffect(() => {
    setCloudId(_cloudId ? _cloudId : null);
  }, [_cloudId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`relative bg-slate-300 overflow-hidden ${rounded ? `rounded-${rounded}` : ""} ${className}`} style={{ width: size, height: size }} {...restProps}>
      <span className="block" style={{ paddingBottom: `${(ratioY / ratioX) * 100}%` }}></span>
      {cloudId ? (
        <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${cloudId}/${cloudVariant}`} alt={alt} layout="fill" objectFit="cover" onError={onError} />
      ) : mounted ? (
        <span role="image" aria-label={alt} className="absolute top-1/2 left-1/2 w-1/2 h-1/2 text-slate-500 -translate-x-1/2 -translate-y-1/2">
          <Icons role="presentation" name="PuzzlePiece" />
        </span>
      ) : null}
    </div>
  );
};

export default Images;
