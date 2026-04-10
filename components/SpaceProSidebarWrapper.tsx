"use client";

import { usePathname } from "next/navigation";
import SpaceProSidebar from "./SpaceProSidebar";

export default function SpaceProSidebarWrapper() {
  const pathname = usePathname();
  const isFotoReview = pathname.includes("foto-review") || pathname.includes("review");

  if (isFotoReview) return null;
  return <SpaceProSidebar />;
}
