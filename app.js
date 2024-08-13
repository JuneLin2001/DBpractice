// Import the functions you need from the SDKs you need
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

// Generate a custom ID for documents
function generateCustomId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomNum = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `${date}${randomNum}`;
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
    <p class="userID">ID: ${data.user_id}</p>
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

// Function to load data from Firestore and display it
async function loadData(tag = null) {
  let q;
  if (tag && tag !== 'all') {
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
  const userID = document.getElementById('userID').value;
  const userEmail = document.getElementById('userEmail').value;
  const userName = document.getElementById('userName').value;

  try {
    const customId = generateCustomId();
    const docRef = doc(db, "posts", customId);
    await setDoc(docRef, {
      id: customId,
      title: title,
      content: content,
      tag: tag,
      author_id: "William Lin",
      created_time: serverTimestamp(),
      user_id: userID,
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

// Search form submission handler
document.getElementById('searchForm').addEventListener('submit', async (event) => {
  event.preventDefault();  
  const searchTag = document.getElementById('searchTag').value;
  loadData(searchTag); // 根據選擇的標籤載入資料
});

// Load data when the page is loaded
window.addEventListener('load', () => loadData('all'));

// Start listening to real-time updates
listenToPost();