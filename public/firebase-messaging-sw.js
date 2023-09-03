/* In this file we are going to first intialize the firebase app for making its instance then use the
event handler onBackgroundMessageHandler for showing the notifications when application is in backgrond state.
*/

importScripts('https://www.gstatic.com/firebasejs/5.5.6/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.5.6/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "AIzaSyA7XT1A2Svkx8A-1jqvsNXTpcxaDYNRlgs",
    authDomain: "notifications-system-6c6d6.firebaseapp.com",
    projectId: "notifications-system-6c6d6",
    storageBucket: "notifications-system-6c6d6.appspot.com",
    messagingSenderId: "113177291764",
    appId: "1:113177291764:web:e6f3fe4abd9b29ab56e7a1"
};

/* The below object firebase is avaliable in response of the API's we set in the head tag.
intialzing an application*/
firebase.initializeApp(firebaseConfig);

//initializing messaging service
const messaging = firebase.messaging();



//Handles background messages when tab is in background.
// The below will show the notification when the application is in background means when in non visible conditions
messaging.setBackgroundMessageHandler(function(payload) {
    console.log(
        '"Firebase-messaging-sw.js" file is recieved.',payload
    );
    
    const notificationTitle = "Background Message Title";
    const notificationOptions = {
        body: "Background Message body.",
        icon: "--You can put you .png fil/e here.--",
    };

    return self.registration.showNotification(
        notificationTitle,
        notificationOptions,
    );
})