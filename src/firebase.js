import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4RSnUDBWdEx5_KfsThQMl_xwNceTP9cU",
  authDomain: "proctoai-57ecc.firebaseapp.com",
  projectId: "proctoai-57ecc",
  storageBucket: "proctoai-57ecc.firebasestorage.app",
  messagingSenderId: "688493186671",
  appId: "1:688493186671:web:9f191f04efbc1ac146079a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;