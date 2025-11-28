# Firebase Storage Setup Guide

## 🚨 **IMPORTANT: Fix the Storage Error**

The error `Firebase Storage: An unknown error occurred` is caused by missing Firebase Storage configuration. Follow these steps:

### **Step 1: Enable Firebase Storage**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `communityapp-ea78a`
3. In the left menu, go to **Storage**
4. Click **"Get started"** if you haven't enabled Storage yet
5. Choose **"Start in test mode"** for now (we'll update rules next)
6. Select a location (choose the closest to your users)
7. Click **"Done"**

### **Step 2: Update Storage Rules**

1. In Firebase Console → Storage, click **"Rules"** tab
2. Replace the existing rules with this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile images - anyone can read, only owner can write
    match /profile_images/{userId}/{fileName} {
      allow read: if true; // Allow anyone to read profile images
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

### **Step 3: Update Firestore Rules**

🚨 **IMPORTANT: This is likely causing your permission errors!**

1. In Firebase Console → **Firestore Database**, click **"Rules"** tab
2. Replace the existing rules with these updated rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read any user profile but only update their own
    match /users/{userId} {
      allow read: if request.auth != null; // Any authenticated user can read user profiles
      allow create, update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }
    
    // Posts can be read by anyone, created/updated by owners
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.ownerUid || 
         request.auth.uid == request.resource.data.ownerUid);
      allow delete: if request.auth != null && request.auth.uid == resource.data.ownerUid;
    }
    
    // Chats are only accessible to participants
    match /chats/{chatId} {
      allow read, create, update: if request.auth != null && 
        request.auth.uid in resource.data.participantIds;
    }
    
    // Messages can only be accessed by chat participants
    match /messages/{messageId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/chats/$(resource.data.chatId)) &&
        request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chatId)).data.participantIds;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.senderId;
    }
    
    // Reviews can be read by anyone, created by authenticated users
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.reviewerUid;
    }
  }
}
```

3. Click **"Publish"**

⚠️ **Key Change**: The user read rule now requires authentication (`request.auth != null`) instead of allowing anyone to read.

### **Step 4: Verify Configuration**

Check that your `firebase.ts` has:
- ✅ Storage initialization: `const storage = getStorage(app);`
- ✅ Storage exports: `export { auth, db, storage };`
- ✅ Storage bucket: `"storageBucket": "communityapp-ea78a.firebasestorage.app"`

### **Step 5: Test the Upload**

1. Restart your app
2. Go to Profile tab
3. Tap camera icon on profile picture
4. Select "Take Photo" or "Choose from Gallery"
5. Save changes

### **Troubleshooting**

**If you still get errors:**

1. **Check Firebase Console**: Make sure Storage is enabled and rules are published
2. **Check Internet Connection**: Ensure you have stable internet
3. **Check Authentication**: Make sure you're logged in
4. **Check Console Logs**: Look for more specific error messages

**Common Issues:**
- `storage/unauthorized` → User not logged in or rules too restrictive
- `storage/unknown` → Storage not enabled or bucket name wrong
- `storage/canceled` → Upload was interrupted
- `permission-denied` → **Firestore rules issue! Update Firestore rules (Step 3)**
- `unavailable` → Network connection issue

**🚨 Specific Fix for Onboarding Error:**

If you're seeing `Onboarding check error: [FirebaseError: Missing or insufficient permissions.]`:

1. **Must update Firestore rules** (see Step 3 above)
2. The issue is that the app can't read the user document to check onboarding status
3. After updating rules, **restart the app completely**
4. The app will then be able to check onboarding and proceed normally

### **Debug Mode**

To enable detailed logging, the upload function now logs:
- Blob size
- Storage reference path
- Upload result
- Download URL

Check your console for these logs to identify where the process fails.

### **Next Steps**

Once Storage is working:
- Profile pictures will upload automatically
- Images will be stored at `profile_images/{userId}/{timestamp}.jpg`
- Profile pictures will display across the app immediately

---

**Need help?** Check the console logs for specific error codes and messages!
