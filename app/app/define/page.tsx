/**
 * /define — redirects to /build.
 *
 * The separate "Define your agent" form was replaced by the inline
 * 3-column builder at /build. This redirect keeps old bookmarks and
 * the e2e smoke test working without a 404.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DefinePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/build");
  }, [router]);
  return null;
}
