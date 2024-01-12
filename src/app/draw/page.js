"use client";
import Link from "next/link";
import React, { useRef, useEffect, useState, use } from "react";
import styles from "./page.modules.css";
import { Stack, Button, Slider } from "@mui/material";

export default function Page() {
  const width = 800;
  const height = 500;
  let canvasRef = useRef(null);
  let mouseX = null;
  let mouseY = null;

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
  const [brushWidth, setBrushWidth] = useState(7);
  const [brushColor, setBrushColor] = useState("#000000");
  const [isDisappear, setIsDisappear] = useState(false);
  const [isOneStroke, setIsOneStroke] = useState(false);
  const [isLimited, setIsLimited] = useState(false);
  const [ink, setInk] = useState(3000);
  const [isAble, setIsAble] = useState(true);
  let inkcount = 0;
  const getContext = () => {
    const canvas = canvasRef.current;
    return canvas.getContext("2d");
  };

  const OnClick = (e) => {
    if (e.button !== 0 || ink <= 0 || !isAble) {
      return;
    }
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ~~(e.clientX - rect.left);
    const y = ~~(e.clientY - rect.top);
    setCurrentStroke([{ x, y }]);
    Draw(x, y);
    if (inkcount > 0) {
      setInk(ink - inkcount);
    }
  };

  const OnMove = (e) => {
    if (e.buttons !== 1 || ink <= 0 || !isAble) {
      return;
    }
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ~~(e.clientX - rect.left);
    const y = ~~(e.clientY - rect.top);
    //setCurrentStroke([...currentStroke, { x, y }]);
    currentStroke.push({ x, y });
    // console.log({ x, y });
    // console.log({ mouseX, mouseY });
    Draw(x, y);
  };

  const DrawEnd = (e) => {
    mouseX = null;
    mouseY = null;
    if (currentStroke.length <= 0 || !isAble) return;
    const nowAllStrokes = allStrokes.strokes;
    setAllStrokes({
      strokes: [...nowAllStrokes, { coordinates: currentStroke }],
    });

    // 白塗りで消したように見せる
    if (isDisappear) {
      setTimeout(() => {
        const ctx = getContext();
        ctx.beginPath();
        for (let j = 0; j < currentStroke.length; j += 1) {
          const xy = currentStroke[j];
          if (j === 0) {
            ctx.moveTo(xy.x, xy.y);
          } else {
            ctx.lineTo(xy.x, xy.y);
            ctx.moveTo(xy.x, xy.y);
          }
        }
        ctx.lineCap = "round";
        ctx.lineWidth = brushWidth + 2;
        ctx.strokeStyle = "#fff";
        ctx.stroke();
      }, 3000); // 3秒後に消す
    }
    setCurrentStroke([]);
    setCurrentWidthColor([
      ...currentWidthColor,
      { width: brushWidth, color: brushColor },
    ]);
    if (isOneStroke) {
      setIsAble(false);
    }

    if (inkcount > 0) {
      setInk(ink - inkcount);
    }
  };

  const Draw = (x, y) => {
    if (ink <= 0) return;
    const ctx = getContext();
    ctx.beginPath();
    ctx.globalAlpha = 1.0;
    if (mouseX === null || mouseY === null) {
      ctx.moveTo(x, y);
    } else {
      ctx.moveTo(mouseX, mouseY);
    }
    ctx.lineTo(x, y);
    if (isLimited && ink > 0) {
      if (mouseX != null) {
        // 線
        inkcount += Math.round(
          Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2)
        );
        if (ink < inkcount) {
          setInk(0);
          return;
        }
      } else {
        // 始点、終点
        inkcount += 3;
      }
    }

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
          defaultValue={7}
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
          全消去
        </Button>
        <Button variant="outlined" onClick={undo} className={styles.button}>
          戻す
        </Button>
        <Button variant="outlined" onClick={redo} className={styles.button}>
          進める
        </Button>
      </div>
      <div className={styles.buttons}>
        <Button
          variant="outlined"
          onClick={() => {
            setIsDisappear((prev) => !prev);
          }}
          className={styles.button}
        >
          虫食い{isDisappear ? "あり" : "なし"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setIsOneStroke((prev) => !prev);
          }}
          className={styles.button}
        >
          一筆書き{isOneStroke ? "あり" : "なし"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setIsLimited((prev) => !prev);
          }}
          className={styles.button}
        >
          限られたインク{isLimited ? "あり" : "なし"}
        </Button>
        <Slider
          //defaultValue={0}
          aria-label="Default"
          value={ink}
          valueLabelDisplay="auto"
          min={0}
          max={3000}
          sx={{ width: "30%" }}
        />
      </div>
    </>
  );
}
