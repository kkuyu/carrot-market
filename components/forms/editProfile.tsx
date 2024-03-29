import Link from "next/link";
import type { HTMLAttributes } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
import { ConcernValue } from "@prisma/client";
// @libs
import { getRandomName } from "@libs/utils";
// @api
import { ProfilePhotoOptions, ProfileConcerns } from "@api/profiles/types";
// @libs
import useUser from "@libs/client/useUser";
// @components
import Labels from "@components/labels";
import Files from "@components/files";
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";
import Icons from "@components/icons";

export interface EditProfileTypes {
  originalPhotoPaths: string;
  currentPhotoFiles: FileList;
  name: string;
  concerns?: ConcernValue[];
}

interface EditProfileProps extends HTMLAttributes<HTMLFormElement> {
  formType: "update";
  formData: UseFormReturn<EditProfileTypes, object>;
  onValid: SubmitHandler<EditProfileTypes>;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const EditProfile = (props: EditProfileProps) => {
  const { formType, formData, onValid, isSuccess, isLoading, className = "", ...restProps } = props;
  const { register, handleSubmit, formState, getValues, setValue } = formData;
  const { type: userType } = useUser();

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-5 ${className}`} {...restProps}>
      {/* 이미지 업로드 */}
      {userType === "member" && (
        <div className="space-y-1">
          <Files
            register={register("currentPhotoFiles")}
            name="currentPhotoFiles"
            fileOptions={ProfilePhotoOptions}
            initialValue={getValues("originalPhotoPaths")}
            updateValue={(value) => setValue("currentPhotoFiles", value)}
            accept="image/*"
          />
          <span className="empty:hidden invalid">{formState.errors.currentPhotoFiles?.message}</span>
        </div>
      )}
      {/* 닉네임 */}
      <div className="space-y-1">
        <Labels text="닉네임" htmlFor="name" />
        <Inputs<EditProfileTypes["name"]>
          register={register("name", {
            required: {
              value: true,
              message: "닉네임을 입력해주세요",
            },
          })}
          required
          name="name"
          type="text"
          appendButtons={
            <Buttons
              tag="button"
              type="button"
              sort="icon-block"
              size="sm"
              status="default"
              onClick={() => {
                const name = getRandomName();
                setValue("name", name);
              }}
              aria-label="랜덤 닉네임 만들기"
            >
              <Icons name="Sparkles" strokeWidth={1.5} className="w-6 h-6" />
            </Buttons>
          }
        />
        <span className="empty:hidden invalid">{formState.errors.name?.message}</span>
      </div>
      {/* 관심사 */}
      {userType === "member" && (
        <div className="space-y-1">
          <Labels tag="span" text="관심사" htmlFor="concerns" />
          <p className="text-gray-500">나의 관심사를 선택해 보세요.</p>
          <div className="flex flex-wrap gap-2">
            {ProfileConcerns.map((concern) => (
              <span key={concern.value}>
                <input {...register("concerns")} type="checkbox" id={concern.value} value={concern.value} className="peer sr-only" />
                <label
                  htmlFor={concern.value}
                  className="block px-3 py-1 rounded-lg border
                    peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-gray-300 peer-checked:text-white peer-checked:bg-gray-600 peer-checked:border-gray-600"
                >
                  {concern.emoji} {concern.text}
                </label>
              </span>
            ))}
          </div>
          <span className="empty:hidden invalid">{formState.errors.concerns?.message}</span>
        </div>
      )}
      {/* 안내 */}
      {userType !== "member" && (
        <div className="text-center">
          <p className="inline-block text-notice opacity-60">
            프로필 사진 및 관심사 설정은
            <Link href="/account/phone" passHref>
              <Buttons tag="a" sort="text-link" status="default">
                휴대폰 인증
              </Buttons>
            </Link>
            후 이용 가능합니다.
          </p>
        </div>
      )}
      {/* 완료 */}
      <Buttons tag="button" type="submit" sort="round-box" disabled={isLoading}>
        완료
      </Buttons>
    </form>
  );
};

export default EditProfile;
