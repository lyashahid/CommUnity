const admin = require('firebase-admin');

// Initialize with your service account key
// You'll need to download this from Firebase Console
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "communityapp-ea78a",
    clientEmail: "firebase-adminsdk-xxxxx@communityapp-ea78a.iam.gserviceaccount.com",
    // You'll need to add your private key here
    privateKey: "YOUR_PRIVATE_KEY_HERE"
  })
});

const db = admin.firestore();

// Sample data
const sampleUsers = [
  {
    uid: 'user1',
    displayName: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    photoURL: null,
    bio: 'Love helping my community!',
    location: { latitude: 40.7128, longitude: -74.0060 },
    rating: 4.8,
    helpedCount: 12
  },
  {
    uid: 'user2', 
    displayName: 'Mike Chen',
    email: 'mike.chen@example.com',
    photoURL: null,
    bio: 'Happy to help with tech and moving tasks',
    location: { latitude: 40.7589, longitude: -73.9851 },
    rating: 4.9,
    helpedCount: 8
  },
  {
    uid: 'user3',
    displayName: 'Emma Wilson',
    email: 'emma.w@example.com',
    photoURL: null,
    bio: 'Available for tutoring and pet care',
    location: { latitude: 40.7489, longitude: -73.9680 },
    rating: 4.7,
    helpedCount: 15
  },
  {
    uid: 'user4',
    displayName: 'Alex Rodriguez',
    email: 'alex.r@example.com',
    photoURL: null,
    bio: 'Strong and ready to help with moving!',
    location: { latitude: 40.7614, longitude: -73.9776 },
    rating: 4.6,
    helpedCount: 6
  },
  {
    uid: 'user5',
    displayName: 'Lisa Park',
    email: 'lisa.p@example.com',
    photoURL: null,
    bio: 'Love helping with groceries and errands',
    location: { latitude: 40.7831, longitude: -73.9712 },
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
  }
];

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');
  
  try {
    // Add users
    console.log('Adding users...');
    for (const user of sampleUsers) {
      await db.collection('users').add({
        ...user,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log(`✅ Added ${sampleUsers.length} users`);

    // Add requests
    console.log('Adding requests...');
    for (const request of sampleRequests) {
      await db.collection('requests').add({
        ...request,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log(`✅ Added ${sampleRequests.length} requests`);

    console.log('🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${sampleUsers.length}`);
    console.log(`- Requests: ${sampleRequests.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

seedDatabase();
