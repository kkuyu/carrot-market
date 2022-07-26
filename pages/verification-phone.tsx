import { NextPage } from "next";
import { useRouter } from "next/router";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import useQuery from "@libs/client/useQuery";
import useMutation from "@libs/client/useMutation";
import { PostVerificationPhoneResponse } from "@api/users/verification-phone";
import { PostConfirmTokenResponse } from "@api/users/confirm-token";
import { PostUserUpdateResponse } from "@api/users/my/update";

import Layout from "@components/layout";
import VerifyPhone, { VerifyPhoneTypes } from "@components/forms/verifyPhone";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";

const VerificationPhone: NextPage = () => {
  const router = useRouter();
  const { hasQuery, query } = useQuery();

  // phone
  const verifyPhoneForm = useForm<VerifyPhoneTypes>({ mode: "onChange" });
  const { setError: verifyPhoneError, setFocus: verifyPhoneFocus, setValue: verifyPhoneSetValue, getValues: verifyPhoneGetValue } = verifyPhoneForm;
  const [confirmPhone, { loading: phoneLoading, data: phoneData }] = useMutation<PostVerificationPhoneResponse>("/api/users/verification-phone", {
    onSuccess: () => {
      verifyTokenFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "NotFoundUser":
          // todo: 이메일 확인 토스트
          router.replace("/verification-email");
          return;
        case "SameExistingAccount":
        case "AlreadySubscribedAccount":
          verifyPhoneError("phone", { type: "validate", message: data.error.message });
          verifyPhoneFocus("phone");
          return;
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // token
  const verifyTokenForm = useForm<VerifyTokenTypes>({ mode: "onChange" });
  const { setError: verifyTokenError, setFocus: verifyTokenFocus } = verifyTokenForm;
  const [confirmToken, { loading: tokenLoading, data: tokenData }] = useMutation<PostConfirmTokenResponse>("/api/users/confirm-token", {
    onSuccess: () => {
      updateUser({
        originData: { email: verifyPhoneGetValue("targetEmail") },
        updateData: { phone: verifyPhoneGetValue("phone") },
      });
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "InvalidToken":
          verifyTokenError("token", { type: "validate", message: data.error.message });
          verifyTokenFocus("token");
          return;
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // update user data
  const [updateUser] = useMutation<PostUserUpdateResponse>("/api/users/my/update", {
    onSuccess: (data) => {
      // todo: 변경 완료 토스트
      console.log(data);
      router.replace("/login");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  useEffect(() => {
    if (hasQuery && !query) {
      // todo: 이메일 확인 토스트
      router.replace("/verification-email");
    }
    if (!query?.targetEmail || !query.targetEmail.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      // todo: 이메일 확인 토스트
      router.replace("/verification-email");
      return;
    }
    verifyPhoneSetValue("targetEmail", query.targetEmail);
  }, [hasQuery, query]);

  return (
    <Layout title="휴대폰 번호 변경" hasBackBtn>
      <section className="container py-5">
        <p className="text-sm">변경된 휴대폰 번호를 입력해주세요. 번호는 안전하게 보관되며 어디에도 공개되지 않아요.</p>

        {/* 전화번호 입력 */}
        <VerifyPhone
          formData={verifyPhoneForm}
          onValid={(data: VerifyPhoneTypes) => {
            if (phoneLoading) return;
            confirmPhone(data);
          }}
          isSuccess={phoneData?.success}
          isLoading={phoneLoading}
        />

        {/* 인증 결과 확인 */}
        {phoneData?.success && (
          <>
            <VerifyToken
              formData={verifyTokenForm}
              onValid={(data: VerifyTokenTypes) => {
                if (tokenLoading) return;
                confirmToken(data);
              }}
              isSuccess={tokenData?.success}
              isLoading={tokenLoading}
            />
          </>
        )}
      </section>
    </Layout>
  );
};

export default VerificationPhone;
