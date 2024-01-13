"use client";
import Link from "next/link";
import React, { useRef, useEffect, useState } from "react";
import styles from "./page.module.css";
import { Stack, Button } from "@mui/material";
import { items } from "./items";
import WebRTCDataChannelDemo from "./WebRTCDataChannelDemo";

export default function Page() {

  const movingTextRef = useRef(null);
  const [random, setRandom] = useState();
  const [inputText, setInputText] = useState("");
  const [movingText, setMovingText] = useState("");
  const [ok, setOk] = useState("");
  function createAnswer() {
    const r = Math.floor(Math.random() * items.length);
    console.log(items[r]);
    setRandom(r);
  }

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
    <>
      <p>
        <Link href={"/"}>トップページ</Link>
      </p>{" "}
      <div className="App">
        <WebRTCDataChannelDemo />
      </div>
      <div className={styles.animationContainer}>
        <div ref={movingTextRef} className={styles.movingText}>
          {movingText}
        </div>
      </div>
      <label>
        入力してください :
        <input
          id="inputText"
          type="text"
          size="20"
          className={styles.inputText}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
          }}
        />
      </label>
      <button onClick={answer}>解答する</button>
      <button onClick={createAnswer}>問題を作る</button>
      <span className={styles.ok}>{ok}</span>
    </>
  );
}
