const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc,
  arrayUnion,
  serverTimestamp 
} = require('firebase/firestore');

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


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data
const SAMPLE_USERS = [
  {
    uid: 'user1',
    email: 'alice@example.com',
    displayName: 'Alice Johnson',
    photoURL: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Passionate about helping neighbors and building community connections.',
    skills: ['Tutoring', 'Pet Care', 'Gardening'],
    location: 'San Francisco, CA',
    joinDate: new Date('2024-01-15'),
    rating: 4.8,
    reviewCount: 12,
    completedRequests: 8,
    helpedPeople: 6,
    responseRate: 95
  },
  {
    uid: 'user2',
    email: 'bob@example.com',
    displayName: 'Bob Smith',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Tech enthusiast and handyman. Love fixing things and helping others.',
    skills: ['Tech Support', 'Home Repair', 'Errands'],
    location: 'San Francisco, CA',
    joinDate: new Date('2024-02-20'),
    rating: 4.9,
    reviewCount: 8,
    completedRequests: 5,
    helpedPeople: 5,
    responseRate: 98
  },
  {
    uid: 'user3',
    email: 'carol@example.com',
    displayName: 'Carol Davis',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Retired teacher who enjoys tutoring and community service.',
    skills: ['Tutoring', 'Errands', 'Pet Care'],
    location: 'Oakland, CA',
    joinDate: new Date('2024-03-10'),
    rating: 4.7,
    reviewCount: 15,
    completedRequests: 12,
    helpedPeople: 10,
    responseRate: 92
  }
];

const SAMPLE_POSTS = [
  {
    title: 'Need help with grocery shopping',
    description: 'I\'m recovering from surgery and need someone to pick up groceries for this week. I can provide a list and payment.',
    category: 'Errands',
    urgency: 'medium',
    status: 'active',
    latitude: 37.7749,
    longitude: -122.4194,
    address: 'San Francisco, CA',
    ownerUid: 'user1',
    ownerName: 'Alice Johnson',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    title: 'Math tutoring for high school algebra',
    description: 'My daughter needs help understanding quadratic equations and polynomials. 2-3 sessions per week preferred.',
    category: 'Tutoring',
    urgency: 'low',
    status: 'active',
    latitude: 37.7749,
    longitude: -122.4150,
    address: 'San Francisco, CA',
    ownerUid: 'user2',
    ownerName: 'Bob Smith',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    title: 'Fix Wi-Fi router connectivity issues',
    description: 'My Wi-Fi keeps dropping. Need someone who knows networking to help diagnose and fix the issue.',
    category: 'Tech Support',
    urgency: 'high',
    status: 'active',
    latitude: 37.7800,
    longitude: -122.4200,
    address: 'San Francisco, CA',
    ownerUid: 'user3',
    ownerName: 'Carol Davis',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    title: 'Dog walking while I\'m at work',
    description: 'Need someone to walk my golden retriever for 30 minutes around noon. He\'s very friendly and loves walks!',
    category: 'Pet Care',
    urgency: 'medium',
    status: 'active',
    latitude: 37.7750,
    longitude: -122.4180,
    address: 'San Francisco, CA',
    ownerUid: 'user1',
    ownerName: 'Alice Johnson',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    title: 'Help moving furniture',
    description: 'Need help moving a couch and two bookshelves to another room. Should take about 1-2 hours.',
    category: 'Moving Help',
    urgency: 'low',
    status: 'active',
    latitude: 37.7760,
    longitude: -122.4170,
    address: 'San Francisco, CA',
    ownerUid: 'user2',
    ownerName: 'Bob Smith',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

const SAMPLE_CHATS = [
  {
    participantIds: ['user1', 'user2'],
    participants: {
      user1: {
        name: 'Alice Johnson',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      user2: {
        name: 'Bob Smith',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      }
    },
    lastMessage: 'Hi Alice! I can help you with grocery shopping tomorrow afternoon.',
    lastMessageTime: serverTimestamp(),
    unreadCount: 1,
    requestTitle: 'Need help with grocery shopping'
  },
  {
    participantIds: ['user2', 'user3'],
    participants: {
      user2: {
        name: 'Bob Smith',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      user3: {
        name: 'Carol Davis',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      }
    },
    lastMessage: 'Thanks for offering to help with math tutoring!',
    lastMessageTime: serverTimestamp(),
    unreadCount: 0,
    requestTitle: 'Math tutoring for high school algebra'
  }
];

const SAMPLE_MESSAGES = [
  {
    chatId: 'chat1',
    senderId: 'user2',
    senderName: 'Bob Smith',
    text: 'Hi Alice! I can help you with grocery shopping tomorrow afternoon.',
    timestamp: serverTimestamp(),
    type: 'text'
  },
  {
    chatId: 'chat1',
    senderId: 'user1',
    senderName: 'Alice Johnson',
    text: 'That would be amazing! What time works for you?',
    timestamp: serverTimestamp(),
    type: 'text'
  },
  {
    chatId: 'chat2',
    senderId: 'user3',
    senderName: 'Carol Davis',
    text: 'Thanks for offering to help with math tutoring!',
    timestamp: serverTimestamp(),
    type: 'text'
  }
];

const SAMPLE_REVIEWS = [
  {
    reviewerUid: 'user2',
    reviewerName: 'Bob Smith',
    revieweeUid: 'user1',
    revieweeName: 'Alice Johnson',
    rating: 5,
    comment: 'Alice was wonderful! Very clear communication and appreciative of the help.',
    requestTitle: 'Grocery shopping help',
    createdAt: serverTimestamp()
  },
  {
    reviewerUid: 'user1',
    reviewerName: 'Alice Johnson',
    revieweeUid: 'user2',
    revieweeName: 'Bob Smith',
    rating: 5,
    comment: 'Bob went above and beyond with the grocery shopping. Highly recommended!',
    requestTitle: 'Grocery delivery',
    createdAt: serverTimestamp()
  }
];

async function setupDatabase() {
  try {
    console.log('Starting Firebase database setup...');

    // Create users
    console.log('Creating users...');
    for (const userData of SAMPLE_USERS) {
      await setDoc(doc(db, 'users', userData.uid), userData);
      console.log(`Created user: ${userData.displayName}`);
    }

    // Create posts
    console.log('Creating posts...');
    const postIds = [];
    for (const postData of SAMPLE_POSTS) {
      const docRef = await addDoc(collection(db, 'posts'), postData);
      postIds.push(docRef.id);
      console.log(`Created post: ${postData.title}`);
    }

    // Create chats
    console.log('Creating chats...');
    const chatIds = [];
    for (const chatData of SAMPLE_CHATS) {
      const docRef = await addDoc(collection(db, 'chats'), chatData);
      chatIds.push(docRef.id);
      console.log(`Created chat between: ${Object.values(chatData.participants).map(p => p.name).join(' & ')}`);
    }

    // Create messages
    console.log('Creating messages...');
    for (let i = 0; i < SAMPLE_MESSAGES.length; i++) {
      const messageData = {
        ...SAMPLE_MESSAGES[i],
        chatId: chatIds[Math.floor(i / 2)] // Distribute messages between chats
      };
      await addDoc(collection(db, 'messages'), messageData);
      console.log(`Created message: ${messageData.text.substring(0, 30)}...`);
    }

    // Create reviews
    console.log('Creating reviews...');
    for (const reviewData of SAMPLE_REVIEWS) {
      await addDoc(collection(db, 'reviews'), reviewData);
      console.log(`Created review from ${reviewData.reviewerName} to ${reviewData.revieweeName}`);
    }

    console.log('\nFirebase database setup completed successfully!');
    console.log('Summary:');
    console.log(`   Users: ${SAMPLE_USERS.length}`);
    console.log(`   Posts: ${SAMPLE_POSTS.length}`);
    console.log(`   Chats: ${SAMPLE_CHATS.length}`);
    console.log(`   Messages: ${SAMPLE_MESSAGES.length}`);
    console.log(`   Reviews: ${SAMPLE_REVIEWS.length}`);
    
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

// Run the setup
setupDatabase();