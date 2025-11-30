const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin SDK
// You'll need to replace this with your actual service account key
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

// Read the firestore rules file
const rules = fs.readFileSync('./firestore.rules', 'utf8');

// Deploy the rules
async function deployRules() {
  try {
    await firestore.securityRules().releaseRules(rules);
    console.log('Firestore rules deployed successfully!');
  } catch (error) {
    console.error('Error deploying Firestore rules:', error);
  }
}

deployRules();
