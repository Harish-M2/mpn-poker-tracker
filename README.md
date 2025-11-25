# MPN - Monthly Poker Night

A web application for tracking monthly Texas Hold'em poker tournaments with real-time cloud sync.

## Features

- **User Authentication** - Secure Firebase Authentication with email/password
- **Tournament Tracking** - Record date, buy-ins, rebuys, and winnings for each tournament
- **Personal Dashboard** - View your tournament history and key statistics
- **Statistics & Analytics** - Monthly performance charts and player comparison leaderboard
- **Cloud Hosting** - Deploy to Firebase Hosting for easy access by your friends
- **Real-time Sync** - All data stored in Firestore and synced across devices

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Once created, click on the Web icon (</>) to add a web app
4. Copy the Firebase configuration object

### 2. Configure Firebase in Your App

1. Open `src/firebase.js`
2. Replace the placeholder config with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 3. Enable Firebase Services

#### Enable Authentication:
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider

#### Enable Firestore Database:
1. Go to **Firestore Database** → **Create database**
2. Start in **production mode**
3. Choose a location close to your users

### 4. Install Dependencies and Run Locally

```bash
npm install
npm start
```

The app will open at `http://localhost:3000`

### 5. Deploy to Firebase Hosting

#### Install Firebase CLI:
```bash
npm install -g firebase-tools
```

#### Login to Firebase:
```bash
firebase login
```

#### Initialize Firebase in your project:
```bash
firebase init
```

Select:
- **Firestore** (configure rules and indexes)
- **Hosting** (configure hosting)

When prompted:
- Public directory: `build`
- Configure as single-page app: `Yes`
- Set up automatic builds with GitHub: `No` (optional)

#### Build and Deploy:
```bash
npm run build
firebase deploy
```

Your app will be live at: `https://your-project-id.firebaseapp.com`

## Usage

1. **Register** a new account with email and password
2. **Add tournament entries** with:
   - Tournament date
   - Buy-in amount
   - Rebuys (optional)
   - Winnings
3. **View your dashboard** to see:
   - Total tournaments played
   - Total money spent
   - Total winnings
   - Net profit/loss
   - Complete tournament history
4. **Check statistics** to:
   - See your monthly performance trends
   - Compare your results with other players
   - View interactive charts and leaderboards

## Security

- Firestore security rules ensure users can only read/write their own data
- All tournament data is visible to authenticated users for comparison
- Passwords are securely handled by Firebase Authentication

## Technology Stack

- **React** - Frontend framework
- **Firebase Authentication** - User authentication
- **Cloud Firestore** - NoSQL database
- **Firebase Hosting** - Static web hosting
- **React Router** - Client-side routing
- **Recharts** - Data visualization

## Sharing with Friends

Once deployed, simply share your Firebase Hosting URL with your friends:
`https://your-project-id.firebaseapp.com`

They can:
1. Create their own accounts
2. Track their own tournament results
3. Compare their performance with everyone else in the group

## Cost

Firebase offers a generous free tier (Spark Plan):
- **Authentication**: 10,000 email/password sign-ins per month
- **Firestore**: 50,000 reads, 20,000 writes, 20,000 deletes per day
- **Hosting**: 10GB storage, 360MB/day bandwidth

This should be more than enough for a group of friends tracking monthly tournaments!

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
