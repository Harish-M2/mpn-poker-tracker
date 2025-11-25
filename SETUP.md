# SETUP GUIDE

## Quick Start - Firebase Setup

Follow these steps to get your poker tracker running and hosted online:

### Step 1: Create Firebase Project

1. Visit https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name (e.g., "poker-tracker")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Get Firebase Configuration

1. In your Firebase project, click the Web icon (</>)
2. Register app name: "poker-tracker"
3. Copy the firebaseConfig object
4. Open `src/firebase.js` in your code editor
5. Replace the placeholder values with your actual config

### Step 3: Enable Authentication

1. In Firebase Console, click "Authentication" in the left menu
2. Click "Get started"
3. Click "Email/Password" under Sign-in providers
4. Toggle "Enable" ON
5. Click "Save"

### Step 4: Enable Firestore Database

1. In Firebase Console, click "Firestore Database" in the left menu
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a location (pick one closest to you)
5. Click "Enable"

### Step 5: Deploy Security Rules

1. In Firestore, click "Rules" tab
2. Replace the content with the rules from `firestore.rules` file
3. Click "Publish"

### Step 6: Run Locally (Test First!)

```bash
npm install
npm start
```

- Open http://localhost:3000
- Register a test account
- Add a test tournament entry
- Verify everything works

### Step 7: Deploy to Firebase Hosting

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (only needed once)
firebase init

# Select these options:
# - Firestore: Configure files
# - Hosting: Configure files
# - Public directory: build
# - Single-page app: Yes
# - Overwrite index.html: No

# Build your app
npm run build

# Deploy to Firebase
firebase deploy
```

### Step 8: Share with Friends!

Your app is now live at: `https://YOUR-PROJECT-ID.firebaseapp.com`

Share this URL with your poker buddies! They can:
- Create their own accounts
- Track their tournament results
- See the leaderboard and compare stats

## Troubleshooting

**Can't log in?**
- Make sure Email/Password is enabled in Firebase Authentication

**Data not saving?**
- Check that Firestore rules are published
- Make sure you're using the correct Firebase config

**Deploy failed?**
- Make sure you ran `npm run build` first
- Check that you're logged into Firebase CLI

**Need help?**
- Check Firebase Console for error messages
- Look at browser console (F12) for errors
- Verify your Firebase config in src/firebase.js

## Next Steps

Once deployed:
1. Register your account
2. Have your friends register their accounts
3. Start tracking your monthly tournaments!
4. Check the statistics page after a few tournaments to see the charts

Enjoy tracking your poker games! 🃏
