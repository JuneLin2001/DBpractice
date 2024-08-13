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

// Function to get user data by email
async function getUserByEmail(email) {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  } else {
    console.error("User not found");
    return null;
  }
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
  const user = await getUserByEmail(data.author_id);

  if (user) {
    const listItem = createListItem(data, user);
    dataList.appendChild(listItem);
  } else {
    console.error("User data not found for ID:", data.author_id);
  }
}

// Function to update current user info display
function updateCurrentUserInfo(user) {
  const emailElement = document.getElementById('currentUserEmail');
  const idElement = document.getElementById('currentUserId');
  const nameElement = document.getElementById('currentUserName');

  if (emailElement && idElement && nameElement) {
    emailElement.textContent = `Email: ${user.email}`;
    idElement.textContent = `ID: ${user.id}`;
    nameElement.textContent = `Name: ${user.name}`;
  } else {
    console.error("One or more current user info elements not found.");
  }
}

// Function to update searched user info display
function updateSearchedUserInfo(user) {
  const emailElement = document.getElementById('searchUserEmail');
  const idElement = document.getElementById('searchUserId');
  const nameElement = document.getElementById('searchUserName');

  if (emailElement && idElement && nameElement) {
    emailElement.textContent = `Email: ${user.email}`;
    idElement.textContent = `ID: ${user.id}`;
    nameElement.textContent = `Name: ${user.name}`;
  } else {
    console.error("One or more searched user info elements not found.");
  }
}

// Function to load data from Firestore based on user email
async function loadDataByEmail(userEmail) {
  const user = await getUserByEmail(userEmail);
  
  if (user) {
    // Update current user info on the page
    updateCurrentUserInfo(user);

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
    updateSearchedUserInfo({ email: '', id: '', name: '' }); // Clear user info
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

// Function to send a friend request
async function sendFriendRequest(toUserId) {
  const fromUserId = localStorage.getItem('currentUserId');
  const fromUserEmail = localStorage.getItem('currentUserEmail');
  const fromUserName = localStorage.getItem('currentUserName');

  if (!fromUserId) {
    alert("Please log in to send friend requests.");
    return;
  }

  const friendRequestId = generateCustomId();
  const friendRequestRef = doc(db, 'users', toUserId, 'friendRequests', friendRequestId);

  try {
    await setDoc(friendRequestRef, {
      fromUserId: fromUserId,
      fromUserEmail: fromUserEmail,
      fromUserName: fromUserName,
      createdAt: serverTimestamp(),
      status: 'pending'  // Initial status of the friend request
    });
    alert("Friend request sent!");
  } catch (e) {
    console.error("Error sending friend request: ", e);
    alert("Failed to send friend request.");
  }
}

// Function to handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const name = document.getElementById('loginName').value;

  try {
    let user = await getUserByEmail(email);

    if (!user) {
      // If user doesn't exist, create a new user
      const userId = generateCustomId();
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: email,
        name: name
      });
      user = { id: userId, email: email, name: name };
    }

    // Save user info to localStorage
    localStorage.setItem('currentUserEmail', user.email);
    localStorage.setItem('currentUserId', user.id);
    localStorage.setItem('currentUserName', user.name);

    // Update current user info on the page
    updateCurrentUserInfo(user);
  } catch (e) {
    console.error("Error during login: ", e);
    alert("Login failed!");
  }
});

// Function to handle search user button click
document.getElementById('searchUserButton').addEventListener('click', async () => {
  const searchEmail = document.getElementById('searchEmail').value;
  const user = await getUserByEmail(searchEmail);

  if (user) {
    updateSearchedUserInfo(user);
    document.getElementById('sendFriendRequestButton').style.display = 'block'; // Show button
  } else {
    alert("User not found.");
    updateSearchedUserInfo({ email: '', id: '', name: '' });
    document.getElementById('sendFriendRequestButton').style.display = 'none'; // Hide button
  }
});

// Function to handle friend request button click
document.getElementById('sendFriendRequestButton').addEventListener('click', async () => {
  const userId = document.getElementById('searchUserId').textContent.split(': ')[1];

  if (userId) {
    await sendFriendRequest(userId);
  } else {
    alert("No user selected.");
  }
});

// Load all data when the page is loaded
window.addEventListener('load', () => {
  const email = localStorage.getItem('currentUserEmail');
  if (email) {
    loadDataByEmail(email);
  } else {
    loadAllData();
  }
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