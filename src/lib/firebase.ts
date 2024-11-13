// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { addDoc, collection, getDoc, getDocs, getFirestore, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { randomUUID } from "crypto";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDVAIbtBvEuEyyKHj-tyt7LCxGQRHWNqqs",
  authDomain: "liminal-notes-sample.firebaseapp.com",
  projectId: "liminal-notes-sample",
  storageBucket: "liminal-notes-sample.firebasestorage.app",
  messagingSenderId: "77724716159",
  appId: "1:77724716159:web:cf4b74a38b3706134a834a",
  measurementId: "G-2FD5CY9TH5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore(app);

export const addNote = async (note: any) => {
  // Add this to firebase and then also update the id of the document
  const noteRef = collection(db, "notes");

  const addedNote = await addDoc(noteRef, note);

  return addedNote
}

const cleanUndefinedFields = (obj: any) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};



export const updateNote = async (noteId: string, updatedContent: any) => {
  if (typeof updatedContent !== 'object' || updatedContent === null) {
    throw new Error("Invalid data: updatedContent should be a non-null object");
  }
  // Reference the "notes" collection
  const noteRef = collection(db, "notes");
  
  // Query to find the document with the specified custom "id" field
  const noteQuery = query(noteRef, where("id", "==", noteId));
  const querySnapshot = await getDocs(noteQuery);

  if (!querySnapshot.empty) {
    // Assuming 'id' is unique, retrieve the first document that matches
    const noteDoc = querySnapshot.docs[0];
    // Create the update object with cleaned content
    console.log(updatedContent);
    
    const updateObject = {
      content: {
        "headingOneID": {
            "id": "headingOneID",
            "type": "HeadingOne",
            "meta": {
                "depth": 0,
                "order": 0
            },
            "value": [
                {
                    "id": "uniqueID1",
                    "type": "heading-one",
                    "props": {
                        "nodeType": "block"
                    },
                    "children": [
                        {
                            "text": "Neural Networks & Digit Recognition: Fundamental Concepts"
                        }
                    ]
                }
            ]
        },
        "headingTwoID": {
            "id": "headingTwoID",
            "type": "HeadingTwo",
            "meta": {
                "depth": 0,
                "order": 1
            },
            "value": [
                {
                    "id": "uniqueID2",
                    "type": "heading-two",
                    "props": {
                        "nodeType": "block"
                    },
                    "children": [
                        {
                            "text": "1. The Challenge of Image Recognition"
                        }
                    ]
                }
            ]
        },
        "bulletedListItem1ID": {
            "id": "bulletedListItem1ID",
            "type": "BulletedList",
            "meta": {
                "order": 2,
                "depth": 0
            },
            "value": [
                {
                    "id": "uniqueID3",
                    "type": "bulleted-list",
                    "children": [
                        {
                            "text": "Written sloppily"
                        }
                    ]
                }
            ]
        },
        "bulletedListItem2ID": {
            "id": "bulletedListItem2ID",
            "type": "BulletedList",
            "meta": {
                "align": "left",
                "depth": 0,
                "order": 3
            },
            "value": [
                {
                    "id": "uniqueID4",
                    "type": "bulleted-list",
                    "children": [
                        {
                            "text": "Rendered at low resolution (28 x 28 pixels)"
                        }
                    ],
                    "props": {
                        "nodeType": "block"
                    }
                }
            ]
        }
    }
    ,
      updated_at: new Date().toString() // Using serverTimestamp() is preferred over new Date().toString()
    };

    // Update the document
    await updateDoc(noteDoc.ref, updateObject);
    return noteDoc.ref;
  } else {
    throw new Error("Note not found");
  }
};

export const getAllNotes = async () => {
  const noteRef = collection(db, "notes");
  const querySnapshot = await getDocs(noteRef);
  console.log(querySnapshot.docs[0].data());
  
  return querySnapshot.docs.map((doc) => doc.data());
}

export const updateTitle = async (noteId: string, title: string) => {
  console.log(noteId, title);
  
  const noteRef = collection(db, "notes");
  const noteQuery = query(noteRef, where("id", "==", noteId));
  const querySnapshot = await getDocs(noteQuery);
  
  if (!querySnapshot.empty) {
    const noteDoc = querySnapshot.docs[0];
    const updateObject = {
      title: title,
      updated_at: serverTimestamp() // Using serverTimestamp() is preferred over new Date().toString()
    };
    await updateDoc(noteDoc.ref, updateObject);
    return noteDoc.ref;
  } else {
    throw new Error("Note not found");
  }
}