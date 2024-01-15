"use client";
import Link from "next/link";
import Image from "next/image";



import styles from "./page.module.css";


export default function Home() {
  function OpenDraw() {
    window.location.href = "/draw";
  }
  function OpenGuess() {
    window.location.href = "/guess";
  }
  return (
    <body className={styles.body}>
      <div>
        <div className={styles.header}>
          {/* <Image
            src="/header.png" // publicディレクトリからの相対パス
            width={1536}
            height={192}
            sizes="100vw"
            style={{
              width: '100%',
              height: 'auto',
            }}
          /> */}
        </div>
        <div className={styles.video_button_draw} onClick={OpenDraw}>
          <video autoPlay muted >
            <source src="/movies/button_draw.mp4" type="video/mp4">
            </source>
          </video>
        </div>
        <div className={styles.video_button_guess} onClick={OpenGuess}>
          <video autoPlay muted>
            <source src="/movies/button_guess.mp4" type="video/mp4">
            </source>
          </video>
        </div>  
        <div className={styles.footer}>
          {/* <Image
            src="/footer.png" // publicディレクトリからの相対パス
            width={1536}
            height={41}
            sizes="100vw"
            style={{
              width: '100%',
              height: 'auto',
            }}
          /> */}
        </div>
      </div>
    </body >
  );
}
