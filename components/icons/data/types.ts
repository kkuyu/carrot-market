export const IconName = {
  ["ArrowUpCircle"]: "ArrowUpCircle",
  ["Bars3"]: "Bars3",
  ["ChatBubbleLeftRight"]: "ChatBubbleLeftRight",
  ["ChatBubbleOvalLeftEllipsis"]: "ChatBubbleOvalLeftEllipsis",
  ["CheckCircle"]: "CheckCircle",
  ["ChevronDown"]: "ChevronDown",
  ["ChevronLeft"]: "ChevronLeft",
  ["Cog8Tooth"]: "Cog8Tooth",
  ["EllipsisVertical"]: "EllipsisVertical",
  ["FaceSmile"]: "FaceSmile",
  ["Heart"]: "Heart",
  ["HeartSolid"]: "HeartSolid",
  ["Home"]: "Home",
  ["MagnifyingGlass"]: "MagnifyingGlass",
  ["MapPin"]: "MapPin",
  ["Newspaper"]: "Newspaper",
  ["PencilSquare"]: "PencilSquare",
  ["Photo"]: "Photo",
  ["Plus"]: "Plus",
  ["PuzzlePiece"]: "PuzzlePiece",
  ["QuestionMarkCircle"]: "QuestionMarkCircle",
  ["QuestionMarkCircleSolid"]: "QuestionMarkCircleSolid",
  ["ShoppingBag"]: "ShoppingBag",
  ["ShoppingCart"]: "ShoppingCart",
  ["Sparkles"]: "Sparkles",
  ["User"]: "User",
  ["VideoCamera"]: "VideoCamera",
  ["XCircle"]: "XCircle",
  ["XMark"]: "XMark",
} as const;

export type IconName = typeof IconName[keyof typeof IconName];
