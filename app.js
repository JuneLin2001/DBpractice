import { v4 as uuidv4 } from 'https://unpkg.com/uuid@10.0.0/dist/esm-browser/index.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  setDoc,
  getDocs,
  query,
  where,
  doc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEjmdPyTkMmtApZ_xsD8AYZTxbi_Gkx2I",
  authDomain: "fir-database-24950.firebaseapp.com",
  databaseURL:
    "https://fir-database-24950-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fir-database-24950",
  storageBucket: "fir-database-24950.appspot.com",
  messagingSenderId: "161406154305",
  appId: "1:161406154305:web:2d7fce7a957b625eaa38c0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to generate a custom ID for documents
function generateCustomId() {
  return uuidv4();
}

// Create a function to generate HTML for a list item
function createListItem(data, createdTime) {
  const listItem = document.createElement("li");
  listItem.innerHTML = `
    <p class="id">ID: ${data.id}</p>
    <p class="title">標題: ${data.title}</p>
    <p class="author_id">作者 ID: ${data.author_id}</p>
    <p class="content">內容: ${data.content}</p>
    <p class="createdTime">創建時間: ${createdTime}</p>
    <p class="tag">${data.tag}</p>
    <p class="userID">使用者ID: ${data.user_id}</p>
    <p class="userEmail">Email: ${data.user_email}</p>
    <p class="userName">名字: ${data.user_name}</p>
  `;
  return listItem;
}

// Update UI for newly added documents
function updateUI(data) {
  console.log(data);

  const dataList = document.getElementById("dataList");
  const createdTime = data.created_time ? data.created_time.toDate().toLocaleString() : new Date().toLocaleString();
  const listItem = createListItem(data, createdTime);
  dataList.appendChild(listItem);
}

// Function to check if a user exists based on email and name, and return their UUID
async function getUserUUID(userEmail, userName) {
  const q = query(collection(db, 'users'), where('email', '==', userEmail), where('name', '==', userName));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data().uuid;
  } else {
    const newUUID = generateCustomId();
    await setDoc(doc(db, 'users', newUUID), { uuid: newUUID, email: userEmail, name: userName });
    return newUUID;
  }
}

// Function to load data from Firestore and display it based on tag or email
async function loadData(tag = null, userEmail = null) {
  let q;

  if (userEmail) {
    q = query(collection(db, 'posts'), where('user_email', '==', userEmail));
  } else if (tag && tag !== 'all') {
    q = query(collection(db, 'posts'), where('tag', '==', tag));
  } else {
    q = query(collection(db, 'posts'));
  }

  const querySnapshot = await getDocs(q);
  const dataList = document.getElementById('dataList');
  dataList.innerHTML = ''; 
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    updateUI(data);
  });
}

// Form submission handler for adding new documents
document.getElementById('dataForm').addEventListener('submit', async (event) => {
  event.preventDefault(); 

  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;
  const tag = document.getElementById('tag').value;
  const userEmail = document.getElementById('userEmail').value;
  const userName = document.getElementById('userName').value;

  try {
    const userUUID = await getUserUUID(userEmail, userName);
    const customId = generateCustomId();
    const docRef = doc(db, "posts", customId);
    await setDoc(docRef, {
      id: customId,
      title: title,
      content: content,
      tag: tag,
      author_id: userUUID,
      created_time: serverTimestamp(),
      user_id: userUUID,
      user_email: userEmail,
      user_name: userName
    });
    console.log("Document written with ID: ", docRef.id);
    alert("資料已送出！");
    loadData();
  } catch (e) {
    console.error("Error adding document: ", e);
    alert("資料送出失敗！");
  }
});

// Function to listen for real-time updates and log them
function listenToPost() {
  const postsCollection = collection(db, "posts");
  onSnapshot(postsCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        updateUI(change.doc.data());
      }
    });
  });
}

// Search form submission handler for searching by tag or email
document.getElementById('searchForm').addEventListener('submit', async (event) => {
  event.preventDefault();  
  const searchTag = document.querySelector('select[name="searchTag"]').value;
  const userEmail = document.getElementById('searchEmail').value;

  if (userEmail) {
    loadData(null, userEmail);
  } else {
    loadData(searchTag);
  }
});

// Load data when the page is loaded
window.addEventListener('load', () => loadData('all'));

// Start listening to real-time updates
listenToPost();