"use client";
import Link from "next/link";
import React, { useRef, useEffect, useState } from "react";
import styles from "./page.module.css";
import { Stack, Button, Slider } from "@mui/material";

export default function Page() {
  const width = 800;
  const height = 500;
  let canvasRef = useRef(null);
  let mouseX = null;
  let mouseY = null;

  const ws = new WebSocket("ws://localhost:3001");
  ws.onopen = () => {
    console.log("Connected to the signaling server");
    startPeerConnection();
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
    const pc = new RTCPeerConnection(peerConnectionConfig);

    // ICE candidate 取得時のイベントハンドラを登録
    pc.onicecandidate = function (evt) {
      if (evt.candidate) {
        // 一部の ICE candidate を取得
        // Trickle ICE では ICE candidate を相手に通知する
        console.log(evt.candidate);
      } else {
        console.log("ICE candidate gathering completed.");
        // 全ての ICE candidate の取得完了（空の ICE candidate イベント）
        // Vanilla ICE では，全てのICE candidate を含んだ SDP を相手に通知する
        // （SDP は pc.localDescription.sdp で取得できる）

        //メッセージを送信
        const message = pc.localDescription.sdp;
        ws.send(message);
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
  function setRemoteSdp() {
    let sdptext = document.getElementById("remoteSDP").value;

    if (peerConnection) {
      // Peer Connection が生成済みの場合，SDP を Answer と見なす
      let answer = new RTCSessionDescription({
        type: "answer",
        sdp: sdptext,
      });
      peerConnection
        .setRemoteDescription(answer)
        .then(function () {
          console.log("setRemoteDescription() succeeded.");
        })
        .catch(function (err) {
          console.error("setRemoteDescription() failed.", err);
        });
    } else {
      // Peer Connection が未生成の場合，SDP を Offer と見なす
      let offer = new RTCSessionDescription({
        type: "offer",
        sdp: sdptext,
      });
      // Peer Connection を生成
      peerConnection = createPeerConnection();
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
        })
        .catch(function (err) {
          console.error("setLocalDescription() failed.", err);
        });
      document.getElementById("status").value = "answer created";
    }
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

  // canvas に描いたストロークの座標情報をすべて保存
  const [allStrokes, setAllStrokes] = useState({
    strokes: [],
  });
  // 現在（今描いている）ストロークの座標情報を保存
  const [currentStroke, setCurrentStroke] = useState([]);
  // undo したストローク情報を保存
  const [undoStrokes, setUndoStrokes] = useState({
    strokes: [],
  });
  const [currentWidthColor, setCurrentWidthColor] = useState([]);
  const [undoWidthColor, setUndoWidthColor] = useState([]);
  const [brushWidth, setBrushWidth] = useState(10);
  const [brushColor, setBrushColor] = useState("#000000");
  const getContext = () => {
    const canvas = canvasRef.current;
    return canvas.getContext("2d");
  };

  const OnClick = (e) => {
    if (e.button !== 0) {
      return;
    }
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ~~(e.clientX - rect.left);
    const y = ~~(e.clientY - rect.top);
    setCurrentStroke([{ x, y }]);
    Draw(x, y);
  };

  const OnMove = (e) => {
    if (e.buttons !== 1) {
      return;
    }
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ~~(e.clientX - rect.left);
    const y = ~~(e.clientY - rect.top);
    //setCurrentStroke([...currentStroke, { x, y }]);
    currentStroke.push({ x, y });
    Draw(x, y);
  };

  const DrawEnd = (e) => {
    mouseX = null;
    mouseY = null;
    if (currentStroke.length > 0) {
      const nowAllStrokes = allStrokes.strokes;
      setAllStrokes({
        strokes: [...nowAllStrokes, { coordinates: currentStroke }],
      });
      setCurrentStroke([]);
      setCurrentWidthColor([
        ...currentWidthColor,
        { width: brushWidth, color: brushColor },
      ]);
    }
  };

  const Draw = (x, y) => {
    const ctx = getContext();
    ctx.beginPath();
    ctx.globalAlpha = 1.0;
    if (mouseX === null || mouseY === null) {
      ctx.moveTo(x, y);
    } else {
      ctx.moveTo(mouseX, mouseY);
    }
    ctx.lineTo(x, y);
    ctx.lineCap = "round";
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = brushColor;
    ctx.stroke();
    mouseX = x;
    mouseY = y;
  };

  const Reset = () => {
    const ctx = getContext();
    ctx.clearRect(0, 0, width, height);
    setAllStrokes({ strokes: [] });
    setCurrentStroke([]);
    setUndoStrokes({ strokes: [] });
    setCurrentWidthColor([]);
  };

  const undo = () => {
    //if (allStrokes === undefined) return;
    const ctx = getContext();
    if (!ctx || !canvasRef.current || !(allStrokes.strokes.length > 0)) return;
    // 一度描画をすべてクリア
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // redo 用に最新のストロークを保存しておく
    const lastStroke = allStrokes.strokes.slice(-1)[0];
    const nowUndoStrokes = undoStrokes.strokes;
    setUndoStrokes({
      strokes: [...nowUndoStrokes, lastStroke],
    });

    // すべてのストローク情報から最後の配列を取り除く
    const newAllStrokes = {
      strokes: allStrokes.strokes.slice(0, -1),
    };

    // 最新のすべてのストローク情報を canvas に描画させる

    for (let i = 0; i < newAllStrokes.strokes.length; i += 1) {
      ctx.beginPath();
      const operation = newAllStrokes.strokes[i];
      for (let j = 0; j < operation.coordinates.length; j += 1) {
        const xy = operation.coordinates[j];
        if (j === 0) {
          ctx.moveTo(xy.x, xy.y);
        } else {
          ctx.lineTo(xy.x, xy.y);
          ctx.moveTo(xy.x, xy.y);
        }
      }
      ctx.lineCap = "round";
      const widthColor = currentWidthColor[i];
      ctx.lineWidth = widthColor.width;
      ctx.strokeStyle = widthColor.color;
      ctx.stroke();
    }

    // 最新のすべてのストローク情報を保存
    setAllStrokes({ strokes: [...newAllStrokes.strokes] });
    setUndoWidthColor([...undoWidthColor, currentWidthColor.pop()]);
  };

  const redo = () => {
    const ctx = getContext();
    if (!ctx || !canvasRef.current || !(undoStrokes.strokes.length > 0)) return;

    // undo したストローク情報から最新のストロークを復元（描画）させる
    const lastUndoOperation = undoStrokes.strokes.slice(-1)[0];
    ctx.beginPath();
    if (lastUndoOperation && lastUndoOperation.coordinates.length > 0) {
      for (let i = 0; i < lastUndoOperation.coordinates.length; i += 1) {
        const xy = lastUndoOperation.coordinates[i];
        if (i === 0) {
          ctx.moveTo(xy.x, xy.y);
        } else {
          ctx.lineTo(xy.x, xy.y);
          ctx.moveTo(xy.x, xy.y);
        }
      }
    }
    ctx.lineCap = "round";
    const widthColor = undoWidthColor.pop();
    ctx.lineWidth = widthColor.width;
    ctx.strokeStyle = widthColor.color;
    ctx.stroke();

    // undoStrokes の一番後ろのストロークを削除する
    const newUndoStrokes = undoStrokes.strokes.slice(0, -1);
    setUndoStrokes({ strokes: [...newUndoStrokes] });

    // redo したストロークをすべてのストローク情報に戻す
    setAllStrokes({
      strokes: [...allStrokes.strokes, lastUndoOperation],
    });
    setCurrentWidthColor([...currentWidthColor, widthColor]);
  };
  return (
    <>
      <p>
        <Link href={"/"}>トップページ</Link>
      </p>

      <canvas
        onMouseDown={OnClick}
        onMouseMove={OnMove}
        onMouseUp={DrawEnd}
        onMouseOut={DrawEnd}
        ref={canvasRef}
        width={`${width}px`}
        height={`${height}px`}
        className={styles.wrapper}
      />
      <Stack direction="row" spacing={3}>
        <span>ペンの太さ</span>
        <Slider
          defaultValue={10}
          aria-label="Default"
          value={brushWidth}
          valueLabelDisplay="auto"
          min={1}
          max={50}
          sx={{ width: "50%" }}
          onChange={(e) => {
            setBrushWidth(e.target.value);
          }}
        />
      </Stack>
      <label>
        ペンの色
        <input
          className={styles.color}
          type="color"
          value={brushColor}
          onChange={(e) => {
            setBrushColor(e.target.value);
          }}
        />
      </label>
      <div className={styles.buttons}>
        <Button variant="outlined" onClick={Reset} className={styles.button}>
          クリア
        </Button>
        <Button variant="outlined" onClick={undo} className={styles.button}>
          戻す
        </Button>
        <Button variant="outlined" onClick={redo} className={styles.button}>
          進む
        </Button>
      </div>
      <div>
        <textarea
          id="history"
          cols="80"
          rows="10"
          readOnly="readonly"
        ></textarea>
      </div>
    </>
  );
}
