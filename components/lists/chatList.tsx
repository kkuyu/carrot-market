import Link from "next/link";
import type { HTMLAttributes } from "react";
// @libs
import useUser from "@libs/client/useUser";
// @components
import Chat, { ChatItem, ChatProps } from "@components/cards/chat";
import Icons from "@components/icons";

interface ChatListProps extends HTMLAttributes<HTMLUListElement> {
  list: ChatItem[];
  isVisibleSingleUser?: boolean;
  cardProps?: Partial<ChatProps>;
  selectItem?: (item: ChatItem, user: ChatItem["users"]) => void;
}

const ChatList = (props: ChatListProps) => {
  const { list, isVisibleSingleUser = false, cardProps = {}, className = "", selectItem, ...restProps } = props;
  const { user } = useUser();

  if (!user?.id) return null;
  if (!Boolean(list.length)) return null;

  return (
    <ul className={`divide-y ${className}`} {...restProps}>
      {list.map((item) => {
        const userGroup = isVisibleSingleUser ? item.users.filter((chatUser) => chatUser.id !== user?.id).map((chatUser) => [chatUser]) : [item.users.filter((chatUser) => chatUser.id !== user?.id)];
        if (!userGroup.length) return null;
        if (!item.chatMessages.length) return null;
        return userGroup.map((users) => {
          const chat = <Chat item={item} users={users} {...cardProps} />;
          return (
            <li key={users.map((user) => user.id).join("-")}>
              {!selectItem ? (
                <Link href={`/chats/${item.id}`}>
                  <a className="block px-5 py-3.5">{chat}</a>
                </Link>
              ) : (
                <button type="button" className="block relative w-full py-3.5 pl-5 pr-12" onClick={() => selectItem(item, users)}>
                  {chat}
                  <Icons name="ChevronRight" className="absolute top-1/2 right-4 w-5 h-5 -translate-y-1/2 text-gray-500" />
                </button>
              )}
            </li>
          );
        });
      })}
    </ul>
  );
};

export default ChatList;
