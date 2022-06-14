import type { NextPage } from "next";
import { useForm } from "react-hook-form";

import useUser from "@libs/client/useUser";

import Layout from "@components/layout";
import Button from "@components/button";
import Input from "@components/input";
import { useEffect } from "react";

interface EditProfileForm {
  email?: string;
  phone?: string;
  formError: string;
}

const EditProfile: NextPage = () => {
  const { user } = useUser();

  const { register, setValue, setError, clearErrors, formState, handleSubmit } = useForm<EditProfileForm>();

  const onValid = ({ email, phone }: EditProfileForm) => {
    if (!email && !phone) {
      setError("formError", { message: "Email OR Phone number are required. You need to choose one." });
    }
  };

  useEffect(() => {
    if (user?.email) setValue("email", user.email);
    if (user?.phone) setValue("phone", user.phone);
  }, [user, setValue]);

  return (
    <Layout canGoBack title="Edit Profile">
      <div className="container pt-5 pb-5">
        <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-none w-14 h-14 bg-slate-500 rounded-full" />
            <label htmlFor="picture" className="px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              <span className="text-sm font-semibold text-gray-700">Change photo</span>
              <input type="file" id="picture" className="a11y-hidden" name="" accept="image/*" />
            </label>
          </div>
          <Input register={register("email")} label="Email address" name="email" type="email" />
          <Input register={register("phone")} label="Phone number" name="phone" type="number" kind="phone" />
          {formState.errors ? <span className="block mt-2 text-sm font-bold text-red-500">{formState.errors.formError?.message}</span> : null}
          <Button type="submit" text="Update profile" />
        </form>
      </div>
    </Layout>
  );
};

export default EditProfile;
