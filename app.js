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
  deleteDoc,
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
    console.error("User not found in getUserByEmail");
    return null;
  }
}

// Function to get user data by ID
async function getUserById(userId) {
  try {
    const userDoc = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDoc);

    if (userSnapshot.exists()) {
      return userSnapshot.data();
    } else {
      console.error("User not found for ID:", userId);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user by ID:", error);
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
    <p class="userEmail">${user ? '使用者 Email: ' + user.email : '使用者 Email: 缺失'}</p>
    <p class="userName">${user ? '使用者名字: ' + user.name : '使用者名字: 缺失'}</p>
  `;
  return listItem;
}

// Update UI for newly added documents
async function updateUI(data) {
  const dataList = document.getElementById("dataList");

  // 嘗試根據 email 查找用戶資料
  let user = await getUserByEmail(data.author_id);

  const listItem = createListItem(data, user);
  dataList.appendChild(listItem);
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

  for (const doc of querySnapshot.docs) {
    const data = doc.data();
    const user = await getUserById(data.author_id); // 根據作者 ID 獲取使用者資料
    const listItem = createListItem(data, user); // 創建列表項
    dataList.appendChild(listItem); // 顯示列表項
  }
}

// Event listener for the tag filter radio buttons
document.querySelectorAll('input[name="tagFilter"]').forEach((radio) => {
  radio.addEventListener('change', (event) => {
    const selectedTag = event.target.value;
    loadAllData(selectedTag); // Load data based on the selected tag
  });
});


// Function to send a friend request
async function sendFriendRequest(toUserId) {
  const id = localStorage.getItem('currentUserId');
  const email = localStorage.getItem('currentUserEmail');
  const name = localStorage.getItem('currentUserName');

  if (!id) {
    alert("Please log in to send friend requests.");
    return;
  }

  // 檢查是否試圖將自己添加為好友
  if (id === toUserId) {
    alert("不能加自己為好友");
    return;
  }

  try {
    // 取得當前使用者的好友列表
    const friendListRef = collection(db, 'users', id, 'friendList');
    const friendListSnapshot = await getDocs(friendListRef);
    const friendList = friendListSnapshot.docs.map(doc => doc.id);

    // 檢查對方是否已經在當前使用者的好友列表中
    const alreadyFriend = friendList.includes(toUserId);

    if (alreadyFriend) {
      alert("The user is already in your friend list.");
      return;
    }

    // 生成好友請求 ID 和引用
    const friendRequestId = generateCustomId();
    const friendRequestRef = doc(db, 'users', toUserId, 'friendRequests', friendRequestId);

    // 發送好友請求
    await setDoc(friendRequestRef, {
      id: id,
      email: email,
      name: name,
    });

    alert("Friend request sent!");
  } catch (e) {
    console.error("Error sending friend request: ", e);
    alert("Failed to send friend request.");
  }
}



// Form submission handler for adding new documents
document.getElementById('dataForm').addEventListener('submit', async (event) => {
  event.preventDefault(); 

  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;
  const tag = document.getElementById('tag').value;

  const userID = localStorage.getItem('currentUserId');

  try {
    const customId = generateCustomId();
    const docRef = doc(db, "posts", customId);

    await setDoc(docRef, {
      id: customId,
      title: title,
      content: content,
      tag: tag,
      author_id: userID, // Only include the author ID
      created_time: serverTimestamp(),
    });

    console.log("Document written with ID: ", docRef.id);
    alert("資料已送出！");
    loadAllData(); // Refresh the data view

  } catch (e) {
    console.error("Error adding document: ", e);
    alert("資料送出失敗！");
  }
});


// Function to display received friend requests
async function displayFriendRequests() {
  const userId = localStorage.getItem('currentUserId');
  if (!userId) return;

  const friendRequestsCollection = collection(db, 'users', userId, 'friendRequests');
  const querySnapshot = await getDocs(friendRequestsCollection);
  const friendRequestsList = document.getElementById('friendRequestsList');
  friendRequestsList.innerHTML = ''; // Clear existing content

  querySnapshot.forEach((requestDoc) => {
    const data = requestDoc.data();
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <form>
        <p class="fromUserId">發送者 ID: ${data.id}</p>
        <p class="fromUserEmail">發送者 Email: ${data.email}</p>
        <p class="fromUserName">發送者名字: ${data.name}</p>
        <button type="button" class="acceptButton">接受</button>  
      </form>
    `;
    friendRequestsList.appendChild(listItem);

    // Add event listener for the "Accept" button
    listItem.querySelector('.acceptButton').addEventListener('click', () => {
      acceptFriendRequest(requestDoc.id, data.id, data.email, data.name);
    });
  });
}

async function acceptFriendRequest(requestDocId, id, email, name) {
  const userId = localStorage.getItem('currentUserId');
  if (!userId) {
    alert("User not logged in");
    return;
  }

  try {
    // Add the friend to the user's friend list
    const userFriendListCollection = collection(db, `users/${userId}/friendList`);
    await setDoc(doc(userFriendListCollection, id), {
      id: id,
      email: email,
      name: name
    });

    // Add the current user to the friend's friend list
    const friendFriendListCollection = collection(db, `users/${id}/friendList`);
    const currentUserEmail = localStorage.getItem('currentUserEmail');
    const currentUserName = localStorage.getItem('currentUserName');
    await setDoc(doc(friendFriendListCollection, userId), {
      id: userId,
      email: currentUserEmail,
      name: currentUserName
    });

    // Remove the friend request
    await deleteDoc(doc(db, 'users', userId, 'friendRequests', requestDocId));

    // Notify the user and update the UI
    alert("Friend request accepted!");
    displayFriendRequests();  // Refresh the friend requests list
    displayFriendlist();      // Update the friend list display
  } catch (e) {
    console.error("Error accepting friend request: ", e);
    alert("Failed to accept friend request.");
  }
}

// Function to display friend list
async function displayFriendlist() {
  const id = localStorage.getItem('currentUserId');
  if (!id) return;

  const friendListCollection = collection(db, 'users', id, 'friendList');
  const querySnapshot = await getDocs(friendListCollection);
  const friendLists = document.getElementById('friendLists');
  friendLists.innerHTML = ''; // Clear existing content

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <p class="friendId">好友 ID: ${data.id}</p>
      <p class="friendEmail">好友 Email: ${data.email}</p>
      <p class="friendName">好友名字: ${data.name}</p>
    `;
    friendLists.appendChild(listItem); // Append to friendLists
  });
}

// Function to handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const name = document.getElementById('loginName').value;

  try {
    let user = await getUserByEmail(email);

    if (user) {
      // 如果使用者存在，檢查名稱是否相符
      if (user.name === name) {
        alert("登入成功");
        localStorage.setItem('currentUserEmail', user.email);
        localStorage.setItem('currentUserId', user.id);
        localStorage.setItem('currentUserName', user.name);

        // 更新頁面上的使用者資訊
        updateCurrentUserInfo(user);
        displayFriendRequests();  // 顯示好友請求
        displayFriendlist(); 
      } else {
        // Name 不符合，登入失敗
        alert("Name does not match!");
      }
    } else {
      // 使用者不存在，創建新使用者
      const userId = generateCustomId();
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: email,
        name: name
      });
      user = { id: userId, email: email, name: name };

      // 儲存使用者資訊到 localStorage
      localStorage.setItem('currentUserEmail', user.email);
      localStorage.setItem('currentUserId', user.id);
      localStorage.setItem('currentUserName', user.name);

      // 更新頁面上的使用者資訊
      updateCurrentUserInfo(user);
      displayFriendRequests();  // 顯示好友請求
    }
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
    displayFriendRequests();
    displayFriendlist();
  }
  loadAllData();
});


async function listenToPosts() {
  // 監聽文章的變更
  const postsCollection = collection(db, "posts");
  onSnapshot(postsCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        updateUI(change.doc.data());
      }
    });
  });

  // 監聽好友請求的變更
  const userId = localStorage.getItem('currentUserId');
  if (userId) {
    const friendRequestsCollection = collection(db, 'users', userId, 'friendRequests');
    onSnapshot(friendRequestsCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          displayFriendRequests(); // 更新好友請求列表
        }
      });
    });

    const friendListCollection = collection(db, 'users', userId, 'friendList');
    onSnapshot(friendListCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "removed") {
          displayFriendlist(); // 更新好友列表
        }
      });
    });
  }
}

// Start listening to real-time updates
listenToPosts();