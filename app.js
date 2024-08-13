import { v4 as uuidv4 } from 'https://unpkg.com/uuid@10.0.0/dist/esm-browser/index.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  setDoc,
  getDocs,
  getDoc,
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

// Function to get user data by ID
async function getUserById(userId) {
  const userDoc = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userDoc);
  
  if (userSnapshot.exists()) {
    return userSnapshot.data();
  } else {
    console.error("User not found");
    return null;
  }
}

// Function to get user data by email
async function getUserByEmail(userEmail) {
  const q = query(collection(db, 'users'), where('email', '==', userEmail));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  } else {
    console.error("User not found");
    return null;
  }
}

// Function to update UI with current user information
function updateCurrentUserInfo(user) {
  document.getElementById('currentUserEmail').textContent = `Email: ${user.email}`;
  document.getElementById('currentUserId').textContent = `ID: ${user.id}`;
  document.getElementById('currentUserName').textContent = `Name: ${user.name}`;
}

// Function to update UI with searched user information
function updateSearchedUserInfo(user) {
  document.getElementById('searchUserEmail').textContent = `Email: ${user.email}`;
  document.getElementById('searchUserId').textContent = `ID: ${user.id}`;
  document.getElementById('searchUserName').textContent = `Name: ${user.name}`;
}

// Create a function to generate HTML for a list item
function createListItem(data, user) {
  const listItem = document.createElement("li");
  const createdTime = data.created_time ? data.created_time.toDate().toLocaleString() : new Date().toLocaleString();
  
  listItem.innerHTML = `
    <p class="id">ID: ${data.id}</p>
    <p class="title">標題: ${data.title}</p>
    <p class="author_id">作者 ID: ${data.author_id}</p>
    <p class="content">內容: ${data.content}</p>
    <p class="createdTime">創建時間: ${createdTime}</p>
    <p class="tag">${data.tag}</p>
    <p class="userEmail">使用者 Email: ${user.email}</p>
    <p class="userName">使用者名字: ${user.name}</p>
  `;
  return listItem;
}

// Update UI for newly added documents
async function updateUI(data) {
  const dataList = document.getElementById("dataList");

  // Get user data based on author_id
  const user = await getUserById(data.author_id);

  if (user) {
    const listItem = createListItem(data, user);
    dataList.appendChild(listItem);
  } else {
    console.error("User data not found for ID:", data.author_id);
  }
}

// Function to load data based on the user email
async function loadDataByEmail(userEmail) {
  const user = await getUserByEmail(userEmail);
  
  if (user) {
    // Update the searched user info on the page
    updateSearchedUserInfo(user);
    
    const q = query(collection(db, 'posts'), where('author_id', '==', user.id));
    const querySnapshot = await getDocs(q);
    const dataList = document.getElementById('dataList');
    dataList.innerHTML = ''; // Clear existing content

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      updateUI(data);
    });
  } else {
    alert("No posts found for this email.");
    updateSearchedUserInfo({ email: "", id: "", name: "" }); // Clear user info
  }
}

// Function to load all data from Firestore
async function loadAllData(tag = 'all') {
  let q;

  if (tag === 'all') {
    q = query(collection(db, 'posts'));
  } else {
    q = query(collection(db, 'posts'), where('tag', '==', tag));
  }

  const querySnapshot = await getDocs(q);
  const dataList = document.getElementById('dataList');
  dataList.innerHTML = ''; // Clear existing content

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    updateUI(data);
  });
}

// Function to handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault(); 

  const email = document.getElementById('loginEmail').value;
  const name = document.getElementById('loginName').value;

  try {
    let user = await getUserByEmail(email);

    if (!user) {
      const userId = generateCustomId();
      user = { id: userId, email: email, name: name };
      await setDoc(doc(db, 'users', userId), user);
    } else {
      user.name = name; // Update name if it already exists
      await setDoc(doc(db, 'users', user.id), user);
    }

    // Store user info in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    // Update current user info on the page
    updateCurrentUserInfo(user);

    alert("登入成功！");
  } catch (e) {
    console.error("Error logging in: ", e);
    alert("登入失敗！");
  }
});

// Form submission handler for adding new documents
document.getElementById('dataForm').addEventListener('submit', async (event) => {
  event.preventDefault(); 

  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;
  const tag = document.getElementById('tag').value;
  const currentUserEmail = document.getElementById('currentUserEmail').textContent.replace('Email: ', '').trim();

  try {
    const user = await getUserByEmail(currentUserEmail);
    if (!user) {
      alert("請先登入！");
      return;
    }

    const customId = generateCustomId();
    const docRef = doc(db, "posts", customId);
    await setDoc(docRef, {
      id: customId,
      title: title,
      content: content,
      tag: tag,
      author_id: user.id,
      created_time: serverTimestamp()
    });
    console.log("Document written with ID: ", docRef.id);
    alert("資料已送出！");
    loadAllData();
  } catch (e) {
    console.error("Error adding document: ", e);
    alert("資料送出失敗！");
  }
});

// Radio button change event to filter data by tag
document.querySelectorAll('input[name="tagFilter"]').forEach((radio) => {
  radio.addEventListener('change', (event) => {
    const selectedTag = event.target.value;
    loadAllData(selectedTag);
  });
});

// Search button click handler to search user by email
document.getElementById('searchUserButton').addEventListener('click', async () => {
  const searchEmail = document.getElementById('searchEmail').value;
  await loadDataByEmail(searchEmail);
});

// Load all data when the page is loaded
window.addEventListener('load', () => {
  // Check if user info is available in localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser) {
    updateCurrentUserInfo(currentUser);
  }
  loadAllData();
});

// Real-time updates for all posts
function listenToPosts() {
  const postsCollection = collection(db, "posts");
  onSnapshot(postsCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        updateUI(change.doc.data());
      }
    });
  });
}

// Start listening to real-time updates
listenToPosts();