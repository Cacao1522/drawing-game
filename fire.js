// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZyJ3bw2R0QlwGZ8oj7ub1f9j7OGeFviI",
  authDomain: "drawing-game-b600c.firebaseapp.com",
  projectId: "drawing-game-b600c",
  storageBucket: "drawing-game-b600c.appspot.com",
  messagingSenderId: "605944972326",
  appId: "1:605944972326:web:475b6f01060266222412e7",
  measurementId: "G-00LR0BEF87",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const db = getFirestore(app);
