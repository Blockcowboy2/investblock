// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA7LczHwNoDH-vyzwt7w3qeYXP0qmnUMb0",
  authDomain: "investblock.firebaseapp.com",
  projectId: "investblock",
  storageBucket: "investblock.firebasestorage.app",
  messagingSenderId: "878436185615",
  appId: "1:878436185615:web:1a394d1a3f6bd65d37957a",
  measurementId: "G-LYQLHS4508"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };