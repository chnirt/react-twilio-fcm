// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-messaging.js')

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
	apiKey: 'AIzaSyAmiJ0Y0isaXy-JoXOLlnMT6OY-SprGFgI',
	authDomain: 'twilio-push-notification-ca82c.firebaseapp.com',
	databaseURL: 'https://twilio-push-notification-ca82c.firebaseio.com',
	projectId: 'twilio-push-notification-ca82c',
	storageBucket: 'twilio-push-notification-ca82c.appspot.com',
	messagingSenderId: '582529668280',
	appId: '1:582529668280:web:5af52fb49880f9dbd3504d',
	measurementId: 'G-WJHJC149B6',
})

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging()
