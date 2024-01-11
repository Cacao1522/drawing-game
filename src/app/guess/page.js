"use client";
import Link from "next/link";
import React, { useRef, useEffect, useState } from "react";
import styles from "./page.module.css";
import { Stack, Button } from "@mui/material";
import { items } from "./items";

export default function Page() {
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");
    ws.onopen = () => {
      console.log("Connected to the signaling server");
    };
    // シグナリングサーバーからメッセージを受信したときのイベント
    ws.onmessage = async function (message) {
      if (message.data instanceof Blob) {
        // Blobオブジェクトが送られてきた場合、テキストに変換する
        const sdpText = await message.data.text();
        setRemoteSdp(sdpText);
      } else {
        // すでにテキスト形式である場合はそのまま使用する
        setRemoteSdp(message.data);
      }
    };

    // ICE server URLs
    let peerConnectionConfig = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    // Data channel オプション
    let dataChannelOptions = {
      ordered: false,
    };

    // Peer Connection
    let peerConnection;

    // Data Channel
    let dataChannel;

    // ページ読み込み時に呼び出す関数
    window.onload = function () {};

    // 新しい RTCPeerConnection を作成する
    function createPeerConnection() {
      let pc = new RTCPeerConnection(peerConnectionConfig);

      // ICE candidate 取得時のイベントハンドラを登録
      pc.onicecandidate = function (evt) {
        if (evt.candidate) {
          // 一部の ICE candidate を取得
          // Trickle ICE では ICE candidate を相手に通知する
          console.log(evt.candidate);
        } else {
          // 全ての ICE candidate の取得完了（空の ICE candidate イベント）
          // Vanilla ICE では，全てのICE candidate を含んだ SDP を相手に通知する
          // （SDP は pc.localDescription.sdp で取得できる）
          // 今回は手動でシグナリングするため textarea に SDP を表示する
        }
      };

      pc.ondatachannel = function (evt) {
        console.log("Data channel created:", evt);
        setupDataChannel(evt.channel);
        dataChannel = evt.channel;
      };

      return pc;
    }

    // ピアの接続を開始する
    function startPeerConnection() {
      // 新しい RTCPeerConnection を作成する
      peerConnection = createPeerConnection();

      // Data channel を生成
      dataChannel = peerConnection.createDataChannel(
        "test-data-channel",
        dataChannelOptions
      );
      setupDataChannel(dataChannel);

      // Offer を生成する
      peerConnection
        .createOffer()
        .then(function (sessionDescription) {
          console.log("createOffer() succeeded.");
          return peerConnection.setLocalDescription(sessionDescription);
        })
        .then(function () {
          // setLocalDescription() が成功した場合
          // Trickle ICE ではここで SDP を相手に通知する
          // Vanilla ICE では ICE candidate が揃うのを待つ
          console.log("setLocalDescription() succeeded.");
        })
        .catch(function (err) {
          console.error("setLocalDescription() failed.", err);
        });
    }

    // Data channel のイベントハンドラを定義する
    function setupDataChannel(dc) {
      dc.onerror = function (error) {
        console.log("Data channel error:", error);
      };
      dc.onmessage = function (evt) {
        console.log("Data channel message:", evt.data);
        let msg = evt.data;
        document.getElementById("history").value =
          "other> " + msg + "\n" + document.getElementById("history").value;
      };
      dc.onopen = function (evt) {
        console.log("Data channel opened:", evt);
      };
      dc.onclose = function () {
        console.log("Data channel closed.");
      };
    }

    // 相手の SDP 通知を受ける
    function setRemoteSdp(message) {
      let sdptext = message;
      console.log("Received remote SDP:\n" + sdptext);
      // if (peerConnection) {
      //   // Peer Connection が生成済みの場合，SDP を Answer と見なす
      //   let answer = new RTCSessionDescription({
      //     type: "answer",
      //     sdp: sdptext,
      //   });
      //   peerConnection
      //     .setRemoteDescription(answer)
      //     .then(function () {
      //       console.log("setRemoteDescription() succeeded.");
      //     })
      //     .catch(function (err) {
      //       console.error("setRemoteDescription() failed.", err);
      //     });
      // } else {
      // Peer Connection が未生成の場合，SDP を Offer と見なす
      let offer = new RTCSessionDescription({
        type: "offer",
        sdp: sdptext,
      });
      
      // Peer Connection を生成
      peerConnection = createPeerConnection();
      
      // Data channel を生成
      dataChannel = peerConnection.createDataChannel(
        "test-data-channel",
        dataChannelOptions
        );
        setupDataChannel(dataChannel);
        peerConnection
        .setRemoteDescription(offer)
        .then(function () {
          console.log("setRemoteDescription() succeeded.");
        })
        .catch(function (err) {
          console.error("setRemoteDescription() failed.", err);
        });
        
        // Answer を生成
        peerConnection
        .createAnswer()
        .then(function (sessionDescription) {
          console.log("createAnswer() succeeded.");
          return peerConnection.setLocalDescription(sessionDescription);
        })
        .then(function () {
          // setLocalDescription() が成功した場合
          // Trickle ICE ではここで SDP を相手に通知する
          // Vanilla ICE では ICE candidate が揃うのを待つ
          console.log("setLocalDescription() succeeded.");
          const message = peerConnection.localDescription.sdp;
          ws.send(message);
        })
        .catch(function (err) {
          console.error("setLocalDescription() failed.", err);
        });
      // }
    }

    // チャットメッセージの送信
    function sendMessage() {
      if (!peerConnection || peerConnection.connectionState != "connected") {
        alert("PeerConnection is not established.");
        return false;
      }
      let msg = document.getElementById("message").value;
      document.getElementById("message").value = "";

      document.getElementById("history").value =
        "me> " + msg + "\n" + document.getElementById("history").value;
      dataChannel.send(msg);

      return true;
    }
  }, []);

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
      </p>
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
