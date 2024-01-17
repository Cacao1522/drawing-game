"use client";
import Link from "next/link";
import React, { useRef, useEffect, useState } from "react";
import styles from "./page.module.css";
import { Stack, Button } from "@mui/material";
import { items } from "./items";
import WebRTCDataChannelDemo from "./WebRTCDataChannelDemo";

export default function Page() {
  const movingTextRef = useRef(null);
  const [inputText, setInputText] = useState("");
  const [movingText, setMovingText] = useState("");
  const [ok, setOk] = useState("");

  function answer() {
    //const inputText = document.getElementById("inputText").value;
    // const movingText = document.getElementById("movingText");
    // movingText.textContent = inputText;
    setMovingText(inputText);
    setInputText("");
    // Reset animation
    const textElement = movingTextRef.current;
    if (textElement) {
      textElement.style.animation = "none";
      textElement.offsetHeight; // リフローをトリガーするためのプロパティ
      textElement.style.animation = null;
    }
    // movingText.style.animation = "none";
    // movingText.offsetHeight; // Trigger reflow
    // movingText.style.animation = null;

    // Clear input field
    //document.getElementById("inputText").value = "";
    // Check the answer
    //var ok = document.getElementById("ok");
    if (inputText === items[random]) {
      setOk("正解！");
    } else {
      setOk(null);
    }
  }

  return (
    <div className={styles.all}>
      <div className={styles.blank} />
      <div className={styles.main}>
        <p>
          <Link href={"/"}>トップページ</Link>
        </p>{" "}
        <div className="App">
          <WebRTCDataChannelDemo />
        </div>
        {/* <div className={styles.animationContainer}>
        <div ref={movingTextRef} className={styles.movingText}>
          {movingText}
        </div>
        </div> */}
      </div>
      <div className={styles.blank} />
      {/* <div className={styles.background_lower}></div>
      <div className={styles.background_upper}></div> */}
    </div>
  );
}
