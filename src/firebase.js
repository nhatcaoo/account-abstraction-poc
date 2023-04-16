// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAKjDnakS6cEyzPyMngJO76HcTEsug89Uk",
    authDomain: "aa-poc-api-0423.firebaseapp.com",
    databaseURL: "https://aa-poc-api-0423-default-rtdb.firebaseio.com",
    projectId: "aa-poc-api-0423",
    storageBucket: "aa-poc-api-0423.appspot.com",
    messagingSenderId: "305835494564",
    appId: "1:305835494564:web:2ca89138614f5327676a31",
    measurementId: "G-WL4RCJ0DZN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
// export const auth = getAuth(app);
// const analytics = getAnalytics(app);
export { database, app };