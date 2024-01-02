import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
//import { Canvas } from "fabric/fabric-impl";

export default function Home() {
  return (
      <p>
        <Link href={"draw"}>ゲームスタート</Link>
        <br />
        <Link href={"answer"}>回答スタート</Link>
      </p>
  );
}
