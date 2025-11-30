const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAjlnDLtTM6h733f2iAZEXWV91opwgbaFs",
  authDomain: "communityapp-ea78a.firebaseapp.com",
  projectId: "communityapp-ea78a",
  storageBucket: "communityapp-ea78a.firebasestorage.app",
  messagingSenderId: "1064584257319",
  appId: "1:1064584257319:web:4e899130e885ac83f89302",
  measurementId: "G-PSGLFE6HME"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearAllData() {
  console.log('Clearing all Firestore data...');
  
  const collections = ['requests', 'chats', 'users', 'posts'];
  
  for (const collectionName of collections) {
    try {
      console.log(`Clearing ${collectionName}...`);
      const querySnapshot = await getDocs(collection(db, collectionName));
      
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      await Promise.all(deletePromises);
      console.log(`✅ Cleared ${querySnapshot.size} documents from ${collectionName}`);
    } catch (error) {
      console.log(`❌ Error clearing ${collectionName}:`, error.message);
    }
  }
  
  console.log('🎉 All data cleared!');
}

clearAllData().catch(console.error);
