import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Replace the following with your app's Firebase project configuration
// You can get this from the Firebase Console -> Project Settings -> General -> Your Apps
const firebaseConfig = {
  apiKey: "AIzaSyA4JT9mOdvL_ijdw0k4w3TjVjmRWwGvgmc",
  authDomain: "gatheringplace-cb028.firebaseapp.com",
  projectId: "gatheringplace-cb028",
  storageBucket: "gatheringplace-cb028.firebasestorage.app",
  messagingSenderId: "220428030760",
  appId: "1:220428030760:web:f37e8e88002ed0adb0b61d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const auth = getAuth(app);