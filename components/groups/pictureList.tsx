import type { HTMLAttributes } from "react";
// @libs
import useModal from "@libs/client/useModal";
// @components
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";
import PictureZoom from "@components/groups/pictureZoom";
import Images from "@components/images";

export type PictureListItem = {
  src: string;
  index: number;
  key: string;
  label: string;
  name: string;
};

export interface PictureListProps extends HTMLAttributes<HTMLDivElement> {
  list?: PictureListItem[];
}

const PictureList = (props: PictureListProps) => {
  const { list = [], className = "", ...restProps } = props;
  const { openModal } = useModal();

  const grids = list.slice(0, 3).map((item, index, array) => {
    let gridItemClass = "";
    if (array.length === 1 && index === 0) gridItemClass = "col-span-2";
    if (array.length === 3 && index === 0) gridItemClass = "row-span-2";

    let ratio = [5, 4];
    if (array.length === 1 && index === 0) ratio = [5, 2];
    if (array.length === 3 && index !== 0) ratio = [5, 2];

    return { gridItemClass, ratio };
  });

  const openThumbnailModal = (list: PictureListItem[], index: number) => {
    openModal<LayerModalProps>(LayerModal, "PictureZoom", {
      headerType: "transparent",
      closeBtnColor: "text-black",
      children: (
        <div className="absolute top-0 left-0 right-0 bottom-0">
          <PictureZoom list={list} defaultIndex={index} />
        </div>
      ),
    });
  };

  if (!list.length) return null;

  return (
    <div className={`${className}`} {...restProps}>
      <div className="relative grid grid-cols-2 gap-1 overflow-hidden rounded-md">
        {list.slice(0, 3).map((item, index) => (
          <button
            key={item.key}
            type="button"
            className={`relative block w-full ${grids[index].gridItemClass}`}
            onClick={() => openThumbnailModal(list, index)}
            aria-label={`${item.label} 이미지 확대 팝업 열기`}
          >
            <Images alt={item.name} cloudId={item.src} size="100%" ratioX={grids[index].ratio[0]} ratioY={grids[index].ratio[1]} cloudVariant="public" className="rounded-none" />
          </button>
        ))}
        {Boolean(list.length > 3) && (
          <div className="absolute top-1/2 right-0 w-1/2 h-1/2 pt-0.5 pl-0.5 pointer-events-none">
            <span className="flex items-center justify-center w-full h-full bg-black/20">
              <span className="text-lg font-semibold text-white">+{list.length - 3}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PictureList;
