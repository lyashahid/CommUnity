const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } = require('firebase/firestore');

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

// Sample data
const sampleUsers = [
  {
    uid: 'user1',
    displayName: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    photoURL: null,
    bio: 'Love helping my community!',
    location: { latitude: 40.7128, longitude: -74.0060 }, // NYC
    rating: 4.8,
    helpedCount: 12
  },
  {
    uid: 'user2', 
    displayName: 'Mike Chen',
    email: 'mike.chen@example.com',
    photoURL: null,
    bio: 'Happy to help with tech and moving tasks',
    location: { latitude: 40.7589, longitude: -73.9851 }, // NYC
    rating: 4.9,
    helpedCount: 8
  },
  {
    uid: 'user3',
    displayName: 'Emma Wilson',
    email: 'emma.w@example.com',
    photoURL: null,
    bio: 'Available for tutoring and pet care',
    location: { latitude: 40.7489, longitude: -73.9680 }, // NYC
    rating: 4.7,
    helpedCount: 15
  },
  {
    uid: 'user4',
    displayName: 'Alex Rodriguez',
    email: 'alex.r@example.com',
    photoURL: null,
    bio: 'Strong and ready to help with moving!',
    location: { latitude: 40.7614, longitude: -73.9776 }, // NYC
    rating: 4.6,
    helpedCount: 6
  },
  {
    uid: 'user5',
    displayName: 'Lisa Park',
    email: 'lisa.p@example.com',
    photoURL: null,
    bio: 'Love helping with groceries and errands',
    location: { latitude: 40.7831, longitude: -73.9712 }, // NYC
    rating: 5.0,
    helpedCount: 20
  }
];

const sampleRequests = [
  {
    title: 'Need help moving heavy furniture',
    description: 'Moving to a new apartment and need help with a couch and dining table',
    category: 'Moving',
    urgency: 'high',
    requesterId: 'user1',
    requesterName: 'Sarah Johnson',
    latitude: 40.7128,
    longitude: -74.0060,
    type: 'feed_request',
    isOfficialRequest: false,
    status: 'open'
  },
  {
    title: 'Math tutoring for calculus',
    description: 'Struggling with calculus homework, need some help understanding derivatives',
    category: 'Education',
    urgency: 'medium',
    requesterId: 'user2',
    requesterName: 'Mike Chen',
    latitude: 40.7589,
    longitude: -73.9851,
    type: 'feed_request',
    isOfficialRequest: false,
    status: 'open'
  },
  {
    title: 'Dog walking this afternoon',
    description: 'Working late today, need someone to walk my golden retriever for 30 mins',
    category: 'Pet Care',
    urgency: 'high',
    requesterId: 'user3',
    requesterName: 'Emma Wilson',
    latitude: 40.7489,
    longitude: -73.9680,
    type: 'feed_request',
    isOfficialRequest: false,
    status: 'open'
  },
  {
    title: 'Grocery shopping help',
    description: 'Recently had surgery, need help picking up groceries from store',
    category: 'Shopping',
    urgency: 'medium',
    requesterId: 'user4',
    requesterName: 'Alex Rodriguez',
    latitude: 40.7614,
    longitude: -73.9776,
    type: 'feed_request',
    isOfficialRequest: false,
    status: 'open'
  },
  {
    title: 'Fix Wi-Fi connection issues',
    description: 'Internet keeps dropping, need someone tech-savvy to help troubleshoot',
    category: 'Tech Support',
    urgency: 'high',
    requesterId: 'user5',
    requesterName: 'Lisa Park',
    latitude: 40.7831,
    longitude: -73.9712,
    type: 'feed_request',
    isOfficialRequest: false,
    status: 'open'
  },
  {
    title: 'Room cleaning help',
    description: 'Need help deep cleaning my bedroom before family visits',
    category: 'Cleaning',
    urgency: 'medium',
    requesterId: 'user1',
    requesterName: 'Sarah Johnson',
    latitude: 40.7128,
    longitude: -74.0060,
    type: 'feed_request',
    isOfficialRequest: false,
    status: 'open'
  },
  {
    title: 'Help with garden work',
    description: 'Need someone to help with weeding and planting flowers',
    category: 'Gardening',
    urgency: 'low',
    requesterId: 'user2',
    requesterName: 'Mike Chen',
    latitude: 40.7589,
    longitude: -73.9851,
    type: 'feed_request',
    isOfficialRequest: false,
    status: 'open'
  },
  {
    title: 'Practice English conversation',
    description: 'Non-native speaker looking to practice conversational English',
    category: 'Education',
    urgency: 'medium',
    requesterId: 'user3',
    requesterName: 'Emma Wilson',
    latitude: 40.7489,
    longitude: -73.9680,
    type: 'feed_request',
    isOfficialRequest: false,
    status: 'open'
  },
  // Some ongoing requests (for testing chat functionality)
  {
    title: 'Help assembling IKEA furniture',
    description: 'Bought a new desk and need help with assembly',
    category: 'Assembly',
    urgency: 'medium',
    requesterId: 'user4',
    requesterName: 'Alex Rodriguez',
    latitude: 40.7614,
    longitude: -73.9776,
    type: 'feed_request',
    isOfficialRequest: false,
    status: 'ongoing',
    helperUid: 'user5',
    helperName: 'Lisa Park'
  },
  {
    title: 'Computer repair help',
    description: 'Laptop running very slow, need help with cleanup',
    category: 'Tech Support',
    urgency: 'high',
    requesterId: 'user5',
    requesterName: 'Lisa Park',
    latitude: 40.7831,
    longitude: -73.9712,
    type: 'feed_request',
    isOfficialRequest: false,
    status: 'ongoing',
    helperUid: 'user1',
    helperName: 'Sarah Johnson'
  }
];

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');
  
  try {
    // Add users
    console.log('Adding users...');
    for (const user of sampleUsers) {
      await setDoc(doc(db, 'users', user.uid), {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    console.log(`✅ Added ${sampleUsers.length} users`);

    // Add requests
    console.log('Adding requests...');
    for (const request of sampleRequests) {
      await addDoc(collection(db, 'requests'), {
        ...request,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    console.log(`✅ Added ${sampleRequests.length} requests`);

    // Add some sample chats for ongoing requests
    console.log('Adding sample chats...');
    const ongoingRequests = sampleRequests.filter(r => r.status === 'ongoing');
    
    for (const request of ongoingRequests) {
      await addDoc(collection(db, 'chats'), {
        participantIds: [request.requesterId, request.helperUid],
        participantNames: [request.requesterName, request.helperName],
        requestId: null, // Will be set after request is created
        createdAt: serverTimestamp(),
        lastMessage: 'Thanks for offering to help!',
        lastMessageTime: serverTimestamp(),
        unreadCounts: {
          [request.requesterId]: 0,
          [request.helperUid]: 1
        }
      });
    }
    console.log(` Added ${ongoingRequests.length} chats`);
    console.log(' Database seeded successfully!');
    console.log('\n Summary:');
    console.log(`- Users: ${sampleUsers.length}`);
    console.log(`- Requests: ${sampleRequests.length} (${sampleRequests.filter(r => r.status === 'open').length} open, ${sampleRequests.filter(r => r.status === 'ongoing').length} ongoing)`);
    console.log(`- Chats: ${ongoingRequests.length}`);

  } catch (error) {
    console.error(' Error seeding database:', error);
  }
}

seedDatabase();
