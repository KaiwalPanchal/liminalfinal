import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { FirebaseOptions } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8aF9sDGUGtapusDjDDZeVGomA-d3EUrk",
  authDomain: "email-signup-f921d.firebaseapp.com",
  projectId: "email-signup-f921d",
  storageBucket: "email-signup-f921d.firebasestorage.app",
  messagingSenderId: "63913609652",
  appId: "1:63913609652:web:2270c2a38f93c62fb38ae1",
  measurementId: "G-LB8VZMEZ0D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };