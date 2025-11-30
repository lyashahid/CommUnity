#!/bin/bash

echo "Deploying Firestore security rules..."

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Deploy firestore rules
firebase deploy --only firestore:rules

echo "Firestore rules deployed!"
