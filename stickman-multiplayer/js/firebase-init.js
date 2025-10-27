// Firebase initialization and authentication (anonymous by default)
// Replace config with your project's values. Provided config is from the prompt.

// Public SDK imports via CDN are expected in HTML; here we assume global firebase namespaces are available.
// If using ES modules, you can adapt to import from 'firebase/app' and 'firebase/database' etc.

export function initFirebase() {
  const config = {
    apiKey: "AIzaSyD9CnMYRBWoA8D672iZhHFx3Sp3WyDfv1I",
    authDomain: "friand-chating.firebaseapp.com",
    databaseURL: "https://friand-chating-default-rtdb.firebaseio.com",
    projectId: "friand-chating",
    storageBucket: "friand-chating.firebasestorage.app",
    messagingSenderId: "638729970930",
    appId: "1:638729970930:web:5b3e1da45863ff63545c6b",
    measurementId: "G-E61C594F8F"
  };

  if (!firebase.apps?.length) {
    firebase.initializeApp(config);
  }
  const db = firebase.database();

  return new Promise((resolve, reject) => {
    firebase
      .auth()
      .signInAnonymously()
      .then(() => {
        const user = firebase.auth().currentUser;
        resolve({ db, user });
      })
      .catch(reject);
  });
}

export function getDB() {
  return firebase.database();
}

export function getAuthUser() {
  return firebase.auth().currentUser;
}

