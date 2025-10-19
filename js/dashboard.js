import { auth, database, storage } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref as dbRef, onValue, get, set, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const userInfo = document.getElementById("user-info");
const cardContainer = document.getElementById("card-container");
const logoutBtn = document.getElementById("logout");
const changePfpBtn = document.getElementById("change-pfp");
const uploadPfpInput = document.getElementById("upload-pfp");
const profilePic = document.getElementById("profile-pic");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  const userRef = dbRef(database, "users/" + user.uid);

  try {
    const userSnap = await get(userRef);
    let userData = userSnap.val();

    // If user node doesn't exist yet
    if (!userData) {
      const defaultUserData = {
        username: user.email.split("@")[0],
        points: 1000,
        cards: {},
        profilePicture: "images/default-pfp.png",
      };
      await set(userRef, defaultUserData);
      userData = defaultUserData;
    }

    // Display user info & profile picture
    userInfo.innerHTML = `${userData.username}<br><span class="points">Points: ${userData.points}</span>`;
    if (userData.profilePicture) {
      profilePic.src = userData.profilePicture;
    }

    // Load user cards
    loadUserCards(userData.cards || {});
  } catch (err) {
    console.error("Error fetching or creating user data:", err);
    alert("Failed to load your data. Please try again.");
  }
});

// ✅ Load user's owned cards
function loadUserCards(userCards) {
  cardContainer.innerHTML = "";

  if (!userCards || Object.keys(userCards).length === 0) {
    cardContainer.innerHTML = "<p>Inventory is currently empty.</p>";
    return;
  }

  // Load all cards from DB once
  get(dbRef(database, "cards")).then((snapshot) => {
    const allCards = snapshot.val();
    if (!allCards) return;

    for (const [id, quantity] of Object.entries(userCards)) {
      const cardData = allCards[id];
      if (!cardData) continue;

      const div = document.createElement("div");
      div.classList.add("card-item");
      div.innerHTML = `
        <h3>${cardData.name}</h3>
        <img src="${cardData.image}" alt="${cardData.name}" class="card-image" />
        <p>Owned: ${quantity}</p>
      `;
      cardContainer.appendChild(div);
    }
  });
}

// ✅ Profile picture upload
changePfpBtn.addEventListener("click", () => {
  uploadPfpInput.click();
});

uploadPfpInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !currentUser) return;

  const filePath = `profile_pictures/${currentUser.uid}.jpg`;
  const fileRef = storageRef(storage, filePath);

  try {
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    await update(dbRef(database, "users/" + currentUser.uid), {
      profilePicture: downloadURL,
    });

    profilePic.src = downloadURL;
    alert("✅ Profile picture updated!");
  } catch (err) {
    console.error("Error uploading profile picture:", err);
    alert("Failed to upload profile picture. Please try again.");
  }
});

// ✅ Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});
