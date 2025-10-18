import { auth, database, storage } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  ref,
  onValue,
  get,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const usernameEl = document.getElementById("username");
const pointsEl = document.getElementById("points");
const profilePic = document.getElementById("profile-pic");
const uploadBtn = document.getElementById("upload-btn");
const uploadInput = document.getElementById("profile-upload");
const cardContainer = document.getElementById("card-container");
const logoutBtn = document.getElementById("logout");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  const userRef = ref(database, "users/" + user.uid);

  try {
    const userSnap = await get(userRef);
    let userData = userSnap.val();

    if (!userData) {
      const defaultUserData = {
        username: user.email.split("@")[0],
        points: 1000,
        cards: {},
        profilePic: "images/default-profile.png",
      };
      await set(userRef, defaultUserData);
      userData = defaultUserData;
    }

    // Display user info
    usernameEl.textContent = userData.username;
    pointsEl.textContent = `Points: ${userData.points}`;
    profilePic.src = userData.profilePic || "images/default-profile.png";

    // Load cards
    loadUserCards(userData.cards || {});
  } catch (err) {
    console.error("Error loading user data:", err);
    alert("Error loading data, please reload.");
  }
});

uploadBtn.addEventListener("click", () => uploadInput.click());

uploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !currentUser) return;

  const imgRef = storageRef(storage, `profile_pics/${currentUser.uid}.jpg`);
  await uploadBytes(imgRef, file);

  const downloadURL = await getDownloadURL(imgRef);
  await update(ref(database, "users/" + currentUser.uid), {
    profilePic: downloadURL,
  });

  profilePic.src = downloadURL;
  alert("Profile picture updated!");
});

function loadUserCards(userCards) {
  cardContainer.innerHTML = "";

  if (!userCards || Object.keys(userCards).length === 0) {
    cardContainer.innerHTML = "<p>You don't own any cards yet!</p>";
    return;
  }

  on
