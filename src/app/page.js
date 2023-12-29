import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { fabric } from "fabric";
//import { Canvas } from "fabric/fabric-impl";

export default function Home() {
  return (
    <p>
      <Link href={"draw"}>ゲームスタート</Link>
    </p>
  );
}
