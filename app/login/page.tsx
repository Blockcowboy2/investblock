"use client";
import React, { useState, useEffect } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User // Import User type
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { app } from '../../firebase-config'; // Assuming firebase-config.ts exports 'app'

console.log('AuthPage component loading...'); // Added log

const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

const AuthPage: React.FC = () => {
  console.log('AuthPage component rendering...'); // Added log
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set up an auth state change listener and create user document if it doesn't exist
  useEffect(() => {
    console.log('AuthPage useEffect running...'); // Added log
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser); // Added log
      setUser(firebaseUser);
      // We don't need loading state here as this page is specifically for auth

      if (firebaseUser) {
        // Check if user document exists in Firestore
        console.log('Checking for user document:', firebaseUser.uid); // Added log
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          // If document doesn't exist, create it with isAdmin: false
          console.log('User document not found, creating...'); // Added log
          try {
            await setDoc(userDocRef, {
              email: firebaseUser.email, // Optionally store email
              isAdmin: false,
              createdAt: new Date() // Optionally store creation date
            });
            console.log("User document created for", firebaseUser.uid);
          } catch (firestoreError: any) {
            console.error("Error creating user document:", firestoreError);
            // Handle error, maybe show a message to the user
          }
        } else {
           console.log('User document found.'); // Added log
        }
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      console.log('AuthPage useEffect cleanup running...'); // Added log
      unsubscribe();
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('Attempting sign up...', email); // Added log
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // User state and Firestore document will be handled by the onAuthStateChanged listener
      console.log('Sign up successful.'); // Added log
    } catch (err: any) {
      console.error('Sign up error:', err); // Added log
      setError(err.message);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
     console.log('Attempting sign in...', email); // Added log
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User state and Firestore document will be handled by the onAuthStateChanged listener
      console.log('Sign in successful.'); // Added log
    } catch (err: any) {
       console.error('Sign in error:', err); // Added log
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
     console.log('Attempting Google sign in...'); // Added log
    try {
      const provider = new GoogleAuthProvider(); // Instantiate the provider here
      await signInWithPopup(auth, provider);
      // User state and Firestore document will be handled by the onAuthStateChanged listener
       console.log('Google sign in successful.'); // Added log
    } catch (err: any) {
       // Handle potential errors, e.g., popup closed, access denied
       console.error("Google Sign-In Error:", err);
       setError(err.message);
    }
  };


  const handleSignOut = async () => {
    setError(null);
     console.log('Attempting sign out...'); // Added log
    try {
      await signOut(auth);
      // User state will be updated by the onAuthStateChanged listener
       console.log('Sign out successful.'); // Added log
    } catch (err: any) {
       console.error('Sign out error:', err); // Added log
      setError(err.message);
    }
  };

  if (user) {
    console.log('User is logged in, rendering welcome message.'); // Added log
    return (
      <div>
        <h2>Welcome, {user.email}</h2>
        <p>You are signed in.</p>
        <button onClick={handleSignOut}>Sign Out</button>
        {/* You might want to add a link to the document form page here */}
      </div>
    );
  }

   console.log('User is not logged in, rendering login form.'); // Added log

  return (
    <div style={{ backgroundColor: 'lightblue', padding: '20px' }}>
      <h2>Sign Up or Sign In</h2>
      <form onSubmit={handleSignIn}>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Sign In</button>
        <button type="button" onClick={handleSignUp}>Sign Up</button>
      </form>
      <button onClick={handleGoogleSignIn}>Sign in with Google</button>
       {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AuthPage;