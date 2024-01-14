"use client";
import Link from "next/link";
import React, { useRef, useEffect, useState } from "react";
import styles from "./page.module.css";
import { items } from "./items";
import WebRTCDataChannelDemo from "./WebRTCDataChannelDemo";

export default function Page() {
  const movingTextRef = useRef(null);
  const [random, setRandom] = useState(null);
  const [inputText, setInputText] = useState("");
  const [movingText, setMovingText] = useState("");
  const [ok, setOk] = useState("");
  const [point, setPoint] = useState(0);
  const [challenge, setChallenge] = useState(0); // 挑戦回数
  const [answertimer, setAnswertimer] = useState(null);
  const [clear, setClear] = useState(0);
  let timerInterval;

  const startTimer = () => {
    setAnswertimer(20);
    timerInterval = setInterval(() => {
      setAnswertimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : prevTimer));
    }, 1000);

    return timerInterval;
  };

  const createAnswer = () => {
    // タイマーが0秒の場合は問題を作成しない
    if (answertimer === 0) {
      return;
    }

    const r = Math.floor(Math.random() * items.length);
    console.log(items[r]);
    setRandom(r);

    // 問題作成ボタンが押されたら前回のタイマーをクリアして新しいタイマーを開始
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    timerInterval = startTimer();
  };

  const answer = () => {
    setMovingText(inputText);
    setInputText("");
    const textElement = movingTextRef.current;
    if (textElement) {
      textElement.style.animation = "none";
      textElement.offsetHeight; // Trigger reflow
      textElement.style.animation = null;
    }

    // タイマーが0秒の場合は解答を受け付けない
    if (answertimer === 0) {
      return;
    }

    if (inputText === items[random]) {
      setOk("正解！");
      setPoint(point + 1);
      setRandom(null);
      setAnswertimer(null);
      setChallenge(challenge + 1);
      setClear(clear + 1);
      // 新しいタイマーが生成されたら前回のタイマーをクリア
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      timerInterval = null;
    } else {
      setOk(null);
    }
    if (answertimer <= 0) {
      setRandom(null);
      setAnswertimer(null);
      clearInterval(timerInterval);
      setChallenge(challenge + 1);
      // 新しいタイマーが生成されたら前回のタイマーをクリア
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      timerInterval = null;
    }
  };

  const gameover = () => {
    if (challenge === 5 && clear < 3) {
      document.write("ゲームオーバー");
    }
    if (challenge === 5 && clear >= 3) {
      document.write("クリア！");
    }
  };

  useEffect(() => {
    // コンポーネントがアンマウントされるときにタイマーをクリア
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

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
      <p>あなたの得点は{point}点です</p>
      <p>残り時間: {answertimer}秒</p>
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
