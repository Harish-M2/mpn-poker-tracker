import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6IHMQPQw6tQeD5rPXjhG1urThvvjV7Fk",
  authDomain: "poker-tracker-5e84a.firebaseapp.com",
  projectId: "poker-tracker-5e84a",
  storageBucket: "poker-tracker-5e84a.firebasestorage.app",
  messagingSenderId: "297124183982",
  appId: "1:297124183982:web:5002d974c9f37f8ab5923f",
  measurementId: "G-PS1GH55S1V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
