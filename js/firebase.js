import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/* FIREBASE CONFIGURATION */
export const firebaseConfig = {
  apiKey: "AIzaSyDL8FfQqIsBbjRoERiKncCWYvu70q_gSLc",
  authDomain: "tabletennis-1e702.firebaseapp.com",
  databaseURL: "https://tabletennis-1e702-default-rtdb.firebaseio.com",
  projectId: "tabletennis-1e702",
  storageBucket: "tabletennis-1e702.firebasestorage.app",
  messagingSenderId: "970232813868",
  appId: "1:970232813868:web:5c0be16f8b396a5d70f489",
  measurementId: "G-D7RD6QR52T"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app, firebaseConfig.databaseURL);
export const auth = getAuth(app);

const rawAppId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'pingpong_challenge_default';
export const appId = rawAppId.replace(/[.#$\[\]]/g, '_');

export let firebaseUser = null;

export function initFirebaseAuth(onSuccess, onError) {
  signInAnonymously(auth).then((cred) => {
    firebaseUser = cred.user;
    console.log("Firebase Anonymous Auth Success:", firebaseUser.uid);
    const statusEl = document.getElementById('rtDbStatusText');
    if (statusEl) statusEl.innerText = "리얼타임 DB 연결 완료 🔥";
    if (typeof onSuccess === 'function') onSuccess(firebaseUser);
  }).catch((err) => {
    console.error("Firebase Auth Error:", err);
    const statusEl = document.getElementById('rtDbStatusText');
    if (statusEl) statusEl.innerText = "DB 연결 오류 발생 ⚠️";
    if (typeof onError === 'function') onError(err);
  });
}

export { ref, set, onValue, remove };
