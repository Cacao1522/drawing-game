"use client";
import Link from "next/link";
import Image from "next/image";
import { db } from "../../fire";
import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// import styles from "./page.module.css";

export default function Home() {
  // ページ移動を検知
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    updateDoc(doc(db, "room1", "localSDP"), { offer: "" });
  }, [pathname, searchParams]);
  return (
    <>
      <p>
        <Link href={"draw"}>ゲームスタート（絵を描く）</Link>
      </p>
      <p>
        <Link href={"guess"}>ゲームスタート（絵のお題を当てる）</Link>
      </p>
    </>
  );
}
