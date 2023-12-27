"use client";
import Link from "next/link";
//import { useServer, useClient } from "next/directives";
import React, { useRef, useLayoutEffect, useState } from "react";
import { fabric } from "fabric";
import styles from "./page.module.css";

const canvasId = "fabric";
const canvasSize = 800;
const initialBrushColor = "black";
export default function Page() {
  const [fabricCanvas, setFabricCanvas] = useState();
  // キャンバスの初期化処理

  useLayoutEffect(() => {
    const canvas = new fabric.Canvas(canvasId, {
      isDrawingMode: true,
      width: canvasSize,
      height: canvasSize,
      //backgroundImage: backgroundImageUrl,
    });
    canvas.freeDrawingBrush.color = initialBrushColor;
    setFabricCanvas(canvas);
  }, []);

  return (
    <>
      <p>
        <Link href={"/"}>トップページ</Link>
      </p>
      <div>
        <canvas id={canvasId} className={styles.wrapper} />
      </div>
    </>
  );
}
