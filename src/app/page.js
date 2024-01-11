import Link from "next/link";
import Image from "next/image";

// import styles from "./page.module.css";

export default function Home() {
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
