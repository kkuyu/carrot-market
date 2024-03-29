import type { HTMLAttributes } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
import { StoryCategory } from "@prisma/client";
// @libs
import { getCategory } from "@libs/utils";
// @api
import { StoryCategories, StoryPhotoOptions } from "@api/stories/types";
// @components
import Labels from "@components/labels";
import TextAreas from "@components/textareas";
import Files from "@components/files";
import Buttons from "@components/buttons";
import Selects from "@components/selects";

export interface EditStoryTypes {
  originalPhotoPaths: string;
  currentPhotoFiles: FileList;
  category: StoryCategory;
  content: string;
  emdAddrNm: string | null;
  emdPosNm: string | null;
  emdPosX: number | null;
  emdPosY: number | null;
}

interface EditStoryProps extends HTMLAttributes<HTMLFormElement> {
  formType: "create" | "update";
  formData: UseFormReturn<EditStoryTypes, object>;
  onValid: SubmitHandler<EditStoryTypes>;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const EditStory = (props: EditStoryProps) => {
  const { formType, formData, onValid, isSuccess, isLoading, className = "", ...restProps } = props;
  const { register, handleSubmit, formState, setValue, getValues } = formData;

  // variable: invisible
  const emdPosNm = getValues("emdPosNm");
  const storyCategories = Object.values(StoryCategory).map(
    (category) =>
      getCategory<StoryCategories>(category, {
        excludeCategory: [StoryCategory["POPULAR_STORY"]],
      })!
  );

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-5 ${className}`} {...restProps}>
      {/* 이미지 업로드 */}
      <div className="space-y-1">
        <Files
          register={register("currentPhotoFiles")}
          name="currentPhotoFiles"
          fileOptions={StoryPhotoOptions}
          initialValue={getValues("originalPhotoPaths")}
          updateValue={(value) => setValue("currentPhotoFiles", value)}
          accept="image/*"
        />
        <span className="empty:hidden invalid">{formState.errors.currentPhotoFiles?.message}</span>
      </div>
      {/* 카테고리 */}
      <div className="space-y-1">
        <Labels tag="span" text="카테고리" htmlFor="category" />
        <Selects<EditStoryTypes["category"]>
          register={register("category", {
            required: {
              value: true,
              message: "카테고리를 선택해주세요",
            },
          })}
          initialValue={formData.getValues("category")}
          updateValue={(value) => setValue("category", value)}
          placeholder="카테고리를 선택해주세요"
          optionGroups={[{ label: "카테고리 선택", options: [...storyCategories.filter((category) => !!category)] }]}
          required
          name="category"
        />
        <span className="empty:hidden invalid">{formState.errors.category?.message}</span>
      </div>
      {/* 게시글 내용 */}
      <div className="space-y-1">
        <Labels text="게시글 내용" htmlFor="content" />
        <TextAreas<EditStoryTypes["content"]>
          register={register("content", {
            required: {
              value: true,
              message: "게시글 내용을 입력해주세요",
            },
            minLength: {
              value: 10,
              message: "10자 이상 입력해주세요",
            },
          })}
          required
          minLength={10}
          name="content"
          placeholder={emdPosNm ? `${emdPosNm}에 올릴 게시글 내용을 작성해주세요.` : `게시글 내용을 작성해주세요.`}
        />
        <span className="empty:hidden invalid">{formState.errors.content?.message}</span>
      </div>
      {/* 완료 */}
      <Buttons tag="button" type="submit" sort="round-box" disabled={isLoading}>
        완료
      </Buttons>
    </form>
  );
};

export default EditStory;
