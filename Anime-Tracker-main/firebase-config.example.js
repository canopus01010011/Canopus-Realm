// ============================================================
// Firebase config template
// ------------------------------------------------------------
// 1. Copy this file to "firebase-config.js" (same folder).
// 2. Fill in the values from Firebase Console → Project settings
//    → General → Your apps → SDK setup and configuration.
// 3. Do NOT commit your real firebase-config.js if you'd rather
//    keep it out of a public repo — but note that Firebase web
//    config values are not secret; access is controlled entirely
//    by your Firestore Security Rules (see firestore.rules).
// ============================================================

const firebaseConfig = {
   apiKey: "AIzaSyCLCK5Gc44SJbBssOPmvITxxneWYifjhZM",
  authDomain: "canopus-realm.firebaseapp.com",
  projectId: "canopus-realm",
  storageBucket: "canopus-realm.firebasestorage.app",
  messagingSenderId: "440886833405",
  appId: "1:440886833405:web:7784602db3ab212d668e94"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
