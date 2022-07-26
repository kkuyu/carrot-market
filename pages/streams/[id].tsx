import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Message, Stream, User } from "@prisma/client";
import useSWR from "swr";

import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";

import Layout from "@components/layout";
import { default as MessageItem } from "@components/message";
import Button from "@components/button";

interface StreamResponse {
  success: boolean;
  stream: Stream & {
    messages: (Pick<Message, "id" | "message"> & { user: Pick<User, "id" | "avatar"> })[];
  };
  recordedVideos?: {
    success: boolean;
    errors: any[];
    messages: any[];
    result: {
      uid: string;
      preview: string;
      thumbnail: string;
    }[];
  };
}

interface ViewsResponse {
  liveViewers: number;
}

interface LifecycleResponse {
  isInput: boolean;
  live: boolean;
  status: string;
  videoUID: string | null;
}

interface MessageForm {
  message: string;
}

const StreamDetail: NextPage = () => {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset } = useForm<MessageForm>();
  const { data, error, mutate } = useSWR<StreamResponse>(router.query.id ? `/api/streams/${router.query.id}` : null, {
    refreshInterval: 1000,
    revalidateOnFocus: false,
  });
  const { data: viewsData } = useSWR<ViewsResponse>(data?.stream?.cloudflareId ? `https://videodelivery.net/${data?.stream?.cloudflareId}/views` : null, {
    refreshInterval: 1000,
  });
  const { data: lifecycleData } = useSWR<LifecycleResponse>(data?.stream?.cloudflareId ? `https://videodelivery.net/${data?.stream?.cloudflareId}/lifecycle` : null, {
    refreshInterval: 1000,
  });

  const { user } = useUser();
  const [sendMessage, { loading, data: sendMessageData }] = useMutation(`/api/streams/${router.query.id}/message`);
  const [deleteStream, { loading: deleteStreamLoading, data: deleteStreamData }] = useMutation<StreamResponse>(`/api/streams/${router.query.id}/delete`);

  const onValid = (data: MessageForm) => {
    if (loading) return;
    reset();
    mutate(
      (prev) =>
        prev && {
          ...prev,
          stream: {
            ...prev.stream,
            messages: [
              ...prev.stream.messages,
              {
                id: Date.now(),
                message: data.message,
                user: user as User,
              },
            ],
          },
        },
      false
    );
    scrollRef?.current?.scrollIntoView();
    sendMessage(data);
  };

  const deleteClick = () => {
    if (deleteStreamLoading) return;
    deleteStream({});
  };

  useEffect(() => {
    if (deleteStreamData?.success) {
      router.push("/streams");
    }
  }, [deleteStreamData, router]);

  useEffect(() => {
    if (data && !data.success) {
      router.push("/streams");
    }
  }, [data, router]);

  if (!data || !data.success || error) {
    return null;
  }

  return (
    <Layout hasBackBtn>
      <div className="container pt-5 pb-16">
        <div>
          {data.stream.cloudflareId && (
            <iframe
              className="w-full aspect-video bg-slate-300 rounded-md shadow-md"
              src={`https://iframe.videodelivery.net/${data?.stream.cloudflareId}`}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen={true}
            ></iframe>
          )}
          <h3 className="mt-5 text-2xl font-semibold text-gray-800">{data.stream.name}</h3>
          <span className="mt-3 block text-xl text-gray-900">${data.stream.price}</span>
          <p className="mt-6 text-gray-700">{data.stream.description}</p>
          {lifecycleData?.live && <p className="text-[14px] text-gray-600 mt-1.5">현재 {viewsData?.liveViewers}명 시청 중</p>}
        </div>
        {data.stream.cloudflareUrl && (
          <div className="mt-4 flex flex-col p-5 bg-orange-400 rounded-md space-y-3">
            <strong>Stream Keys (secret)</strong>
            <p className="text-white">
              <span className="font-medium text-gray-800">URL:</span> {data.stream.cloudflareUrl}
            </p>
            <p className="text-white">
              <span className="font-medium text-gray-800">Key:</span> {data.stream.cloudflareKey}
            </p>
            <Button text={deleteStreamLoading ? "Loading" : "Delete Stream"} disabled={deleteStreamLoading} onClick={deleteClick} />
          </div>
        )}
        <div className="mt-4 pt-4 -mx-4 px-4 h-[50vh] border-t overflow-y-auto">
          <div className="space-y-4">
            {data.stream.messages.map((message) => (
              <MessageItem key={message.id} message={message.message} reversed={message.user.id === user?.id} />
            ))}
            <div ref={scrollRef} />
          </div>
          <div className="fixed bottom-0 left-0 w-full">
            <div className="mx-auto w-full max-w-xl bg-white border-t">
              <form onSubmit={handleSubmit(onValid)} noValidate className="relative px-2 py-2">
                <input
                  {...register("message", { required: true })}
                  required
                  type="text"
                  className="w-full pl-3.5 pr-10 py-1.5 border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
                <div className="absolute top-1/2 right-4 -translate-y-1/2">
                  <button
                    type="submit"
                    className="flex items-center justify-center w-6 h-6 text-sm text-white bg-orange-500 rounded-full
                focus:outline-none hover:bg-orange-600 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    &rarr;
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StreamDetail;
