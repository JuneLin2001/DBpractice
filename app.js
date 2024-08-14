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

async function getUserByAuthorId(authorId) {
  const q = query(collection(db, 'users'), where('id', '==', authorId));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  } else {
    console.error("User not found in getUserByAuthorId");
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
    <div class="post-style">
    <p class="title">【${data.title}】<span class="userName">${user ? '作者:' + user.name : "找不到作者"}</span></p>
    <p class="content">${data.content}</p>
    </div>
    <p class="id">文章ID: ${data.id}</p>
    <p class="author_id">作者ID: ${data.author_id}</p>
    <p class="userEmail">${user ? '作者Email: ' + user.email : '找不到作者Email'}</p>
    <p class="createdTime">創建時間: ${createdTime}</p>
    <p class="tag">${data.tag}</p>
  `;
  return listItem;
}

async function updateUI(data) {
  const dataList = document.getElementById("dataList");

  let user = await getUserByAuthorId(data.author_id);

  const listItem = createListItem(data, user);
  dataList.appendChild(listItem);
}

function updateCurrentUserInfo() {
  const emailElement = document.getElementById('currentUserEmail');
  const idElement = document.getElementById('currentUserId');
  const nameElement = document.getElementById('currentUserName');

  if (emailElement && idElement && nameElement) {
    emailElement.textContent = `Email: ${localStorage.getItem('currentUserEmail')}`;
    idElement.textContent = `ID: ${localStorage.getItem('currentUserId')}`;
    nameElement.textContent = `Name: ${localStorage.getItem('currentUserName')}`;
  } else {
    console.error("One or more current user info elements not found.");
  }
}

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

async function loadAllData(tag = 'all') {
  let q;
  if (tag === 'all') {
    q = query(collection(db, 'posts'));
    document.getElementById('dataListTitle').textContent = "文章一覽";
  } else {
    q = query(collection(db, 'posts'), where('tag', '==', tag));
    document.getElementById('dataListTitle').textContent = `${tag}文章一覽`;
  }
  const querySnapshot = await getDocs(q);
  const dataList = document.getElementById('dataList');
  dataList.innerHTML = ''; 

  for (const doc of querySnapshot.docs) {
    const data = doc.data();
    const user = await getUserById(data.author_id); 
    const listItem = createListItem(data, user); 
    dataList.appendChild(listItem); 
  }
}

// Event listener for the tag filter radio buttons
document.querySelectorAll('input[name="tagFilter"]').forEach((radio) => {
  radio.addEventListener('change', (event) => {
    const selectedTag = event.target.value;
    loadAllData(selectedTag); 
  });
});


async function sendFriendRequest(toUserId) {
  const id = localStorage.getItem('currentUserId');
  const email = localStorage.getItem('currentUserEmail');
  const name = localStorage.getItem('currentUserName');

  if (!id) {
    alert("請先登入");
    return;
  }

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
      alert("已經是好友了");
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

    alert("已送出好友請求!");
  } catch (e) {
    console.error("Error sending friend request: ", e);
    alert("Failed to send friend request.");
  }
}

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
      author_id: userID, 
      created_time: serverTimestamp(),
    });

    console.log("Document written with ID: ", docRef.id);
    alert("資料已送出！");
    loadAllData(); 
  } catch (e) {
    console.error("Error adding document: ", e);
    alert("資料送出失敗！");
  }
});


async function displayFriendRequests() {
  const userId = localStorage.getItem('currentUserId');
  if (!userId) return;

  const friendRequestsCollection = collection(db, 'users', userId, 'friendRequests');
  const querySnapshot = await getDocs(friendRequestsCollection);
  const friendRequestsList = document.getElementById('friendRequestsList');
  friendRequestsList.innerHTML = ''; 

  querySnapshot.forEach((requestDoc) => {
    const data = requestDoc.data();
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <form>
        <p class="fromUserId">發送者ID: ${data.id}</p>
        <p class="fromUserEmail">發送者Email: ${data.email}</p>
        <p class="fromUserName">發送者名字: ${data.name}</p>
        <button type="button" class="acceptButton">接受</button>  
      </form>
    `;
    friendRequestsList.appendChild(listItem);

    listItem.querySelector('.acceptButton').addEventListener('click', () => {
      acceptFriendRequest(requestDoc.id, data.id, data.email, data.name);
    });
  });
}

async function acceptFriendRequest(requestDocId, id, email, name) {
  const userId = localStorage.getItem('currentUserId');
  if (!userId) {
    alert("尚未登入");
    return;
  }

  try {
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

    alert("已同意好友申請!");
    displayFriendRequests();  
    displayFriendlist();   
  } catch (e) {
    console.error("Error accepting friend request: ", e);
    alert("Failed to accept friend request.");
  }
}

async function displayFriendlist() {
  const userId = localStorage.getItem('currentUserId');
  if (!userId) return;

  const friendListCollection = collection(db, 'users', userId, 'friendList');
  const querySnapshot = await getDocs(friendListCollection);
  const friendLists = document.getElementById('friendLists');
  friendLists.innerHTML = ''; // Clear existing content

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <p class="friendId">好友ID: ${data.id}</p>
      <p class="friendEmail">好友Email: ${data.email}</p>
      <p class="friendName">好友名字: ${data.name}</p>
      <a href= #postlists>
      <button type="button" class="viewButton" data-friend-id="${data.id}" data-friend-name="${data.name}">查看好友全部文章</button>
      </a>
      `;
    friendLists.appendChild(listItem); // Append to friendLists
  });

  // Add event listeners for "viewButton"
  document.querySelectorAll('.viewButton').forEach(button => {
    button.addEventListener('click', (event) => {
      const friendId = event.target.getAttribute('data-friend-id');
      const friendName = event.target.getAttribute('data-friend-name');
        document.getElementById('dataListTitle').textContent = `${friendName} 的文章一覽`;
        loadPostsByFriendId(friendId); // Load and display friend's posts
    });
  });
}

async function loadPostsByFriendId(friendId) {
  const postsCollection = collection(db, 'posts');
  const q = query(postsCollection, where('author_id', '==', friendId));
  const querySnapshot = await getDocs(q);
  const dataList = document.getElementById('dataList');
  dataList.innerHTML = ''; // Clear existing content

  // Load user information
  const user = await getUserById(friendId);

    if (querySnapshot.empty) {
    alert("找不到該用戶的文章");
    loadAllData()
    return;
  }

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const listItem = createListItem(data, user); // Pass user data to createListItem
    dataList.appendChild(listItem); // Append to dataList
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
      if (user.name === name) {
        alert("登入成功");
        localStorage.setItem('currentUserEmail', user.email);
        localStorage.setItem('currentUserId', user.id);
        localStorage.setItem('currentUserName', user.name);

        updateCurrentUserInfo(user);
        displayFriendRequests();
        displayFriendlist(); 
      } else {
        alert("登入失敗!");
      }
    } else {
      const userId = generateCustomId();
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: email,
        name: name
      });
      user = { id: userId, email: email, name: name };

      localStorage.setItem('currentUserEmail', user.email);
      localStorage.setItem('currentUserId', user.id);
      localStorage.setItem('currentUserName', user.name);

      updateCurrentUserInfo(user);
      displayFriendRequests();  
    }
  } catch (e) {
    console.error("Error during login: ", e);
    alert("Login failed!");
  }
});

document.getElementById('searchUserButton').addEventListener('click', async () => {
  const searchEmail = document.getElementById('searchEmail').value;
  const user = await getUserByEmail(searchEmail);

  if (user) {
    updateSearchedUserInfo(user);
    document.getElementById('sendFriendRequestButton').style.display = 'block';
  } else {
    alert("未找到該用戶");
    updateSearchedUserInfo({ email: '', id: '', name: '' });
    document.getElementById('sendFriendRequestButton').style.display = 'none'; 
  }
});

document.getElementById('sendFriendRequestButton').addEventListener('click', async () => {
  const userId = document.getElementById('searchUserId').textContent.split(': ')[1];

  if (userId) {
    await sendFriendRequest(userId);
  } else {
    alert("沒有找到該用戶");
  }
});

// Load all data when the page is loaded
window.addEventListener('load', () => {
  const email = localStorage.getItem('currentUserEmail');
  if (email) {
    displayFriendRequests();
    displayFriendlist();
  }
  loadAllData();
  updateCurrentUserInfo();
});


async function listenToPosts() {
  const postsCollection = collection(db, "posts");
  onSnapshot(postsCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        updateUI(change.doc.data());
      }
    });
  });

  const userId = localStorage.getItem('currentUserId');
  if (userId) {
    const friendRequestsCollection = collection(db, 'users', userId, 'friendRequests');
    onSnapshot(friendRequestsCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "removed") {
          displayFriendRequests();
        }
      });
    });

    const friendListCollection = collection(db, 'users', userId, 'friendList');
    onSnapshot(friendListCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "removed") {
          displayFriendlist(); 
        }
      });
    });
  }
}

listenToPosts();