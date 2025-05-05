import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyA6aK5CcnPySxkeysRz3oQjElv-pbr9APk",
    authDomain: "smarttrashbins-1f35f.firebaseapp.com",
    databaseURL: "https://smarttrashbins-1f35f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smarttrashbins-1f35f",
    storageBucket: "smarttrashbins-1f35f.firebasestorage.app",
    messagingSenderId: "968261029027",
    appId: "1:968261029027:web:020f80c41e5be066494316"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, onValue };
