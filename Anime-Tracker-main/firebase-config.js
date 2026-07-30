// Firebase Configuration
// Replace these with your actual Firebase project config
const firebaseConfig = {
   apiKey: "AIzaSyCLCK5Gc44SJbBssOPmvITxxneWYifjhZM",
  authDomain: "canopus-realm.firebaseapp.com",
  projectId: "canopus-realm",
  storageBucket: "canopus-realm.firebasestorage.app",
  messagingSenderId: "440886833405",
  appId: "1:440886833405:web:7784602db3ab212d668e94"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence for better performance
db.enablePersistence().catch((err) => {
    if (err.code == 'failed-precondition') {
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
        console.log('The current browser does not support all of the features required to enable persistence');
    }
});

console.log('Firebase initialized successfully');
