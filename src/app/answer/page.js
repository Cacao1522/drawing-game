"use client";
import Link from "next/link";
import React, { useRef, useEffect, useState } from "react";
import styles from "./page.module.css";
import { Stack, Button, Slider } from "@mui/material";

export default function Page() {
  //WebSocketサーバーとのコネクション確立
  const ws = new WebSocket("ws://localhost:3001");
  ws.onopen = () => {
    console.log("Connected to the signaling server");
  };
  //RTCPeerConnectionの設定
  const peerConnection = new RTCPeerConnection();
  //シグナリングのイベントハンドラーの設定
  // Offerを受け取った場合の処理
  ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (!data) {
      return; // データが無効の場合は早期リターン
    }
    switch (data.type) {
      case "offer":
        peerConnection
          .setRemoteDescription(new RTCSessionDescription(data.offer)) // data.offerを利用
          .then(() => peerConnection.createAnswer())
          .then((answer) => peerConnection.setLocalDescription(answer))
          .then(() =>
            ws.send(
              JSON.stringify({
                type: "answer",
                answer: peerConnection.localDescription,
              })
            )
          );
        break;
      case "answer":
        // Answerを受け取った時の処理は通常は必要ありません。
        // Offerを送った側だけがAnswerを処理すればよいためです。
        break;
      case "candidate":
        // ICE Candidateを受け取った時の処理
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        break;
      // その他のメッセージタイプに対する処理を書く
      default:
      //無視するか、またはエラーメッセージを表示する
    }
  };
  //OfferとAnswerの交換、ICE候補の交換

  // キャンバスエレメントを作成
  const canvasElement = document.createElement("canvas");
  canvasElement.id = "remoteCanvas";
  document.body.appendChild(canvasElement);

  // キャンバスのコンテキストを取得
  const ctx = canvasElement.getContext("2d");

  // メディアストリームのビデオトラックをキャンバスに描画
  peerConnection.ontrack = (event) => {
    const remoteStream = event.streams[0];
    const videoTrack = remoteStream.getVideoTracks()[0];

    // キャンバスのサイズをビデオトラックに合わせる
    canvasElement.width = videoTrack.getSettings().width;
    canvasElement.height = videoTrack.getSettings().height;

    // ビデオフレームをキャンバスに描画
    function drawVideoFrame() {
      ctx.drawImage(
        videoTrack,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      requestAnimationFrame(drawVideoFrame);
    }

    // フレーム描画を開始
    requestAnimationFrame(drawVideoFrame);
  };
}
