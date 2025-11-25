// Run this in your browser console while logged in to create your user document

import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { auth } from './firebase';

async function createUserDocument() {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('No user logged in');
    return;
  }

  try {
    await setDoc(doc(db, 'users', currentUser.uid), {
      displayName: 'Harish Mistry', // Change this to your name
      email: currentUser.email,
      isAdmin: true,
      createdAt: new Date()
    });
    
    console.log('User document created successfully!');
    console.log('Refresh the page to see changes');
  } catch (error) {
    console.error('Error creating user document:', error);
  }
}

createUserDocument();
