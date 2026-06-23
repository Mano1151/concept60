import dotenv from 'dotenv';
import { getFirestore } from './firebaseAdmin.js';

dotenv.config();

async function checkFirestore() {
  try {
    const db = getFirestore();
    console.log('Connecting to Firestore...');
    
    const usersSnapshot = await db.collection('users').limit(5).get();
    
    if (usersSnapshot.empty) {
      console.log("No users found in the 'users' collection.");
      return;
    }
    
    for (const doc of usersSnapshot.docs) {
      console.log(`\nUser Document ID: ${doc.id}`);
      console.log(`User Data:`, doc.data());
      
      const historySnapshot = await db.collection('users').doc(doc.id).collection('searchHistory').limit(2).get();
      
      if (historySnapshot.empty) {
        console.log(`  No search history found for user ${doc.id}.`);
      } else {
        console.log(`  Recent Search History for user ${doc.id}:`);
        historySnapshot.forEach(h => {
          const data = h.data();
          console.log(`    - Concept: ${data.concept} | Category: ${data.category}`);
        });
      }
    }
  } catch (error) {
    console.error("Error accessing Firestore:", error);
  }
}

checkFirestore();
