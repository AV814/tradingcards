import { database } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const profileList = document.getElementById("profile-list");

const usersRef = ref(database, "users");
onValue(usersRef, (snapshot) => {
  const users = snapshot.val();
  if (!users) {
    profileList.innerHTML = "<p>No players found yet.</p>";
    return;
  }

  const userArray = Object.entries(users).map(([uid, data]) => ({
    uid,
    name: data.name || "Unknown Player",
    points: data.points || 0
  }));

  // Sort alphabetically by name
  userArray.sort((a, b) => a.name.localeCompare(b.name));

  profileList.innerHTML = userArray
    .map(
      (u) => `
      <div class="profile-card">
        <h3>${u.name}</h3>
        <p>${u.points} pts</p>
        <a href="profile.html?id=${u.uid}">View Collection →</a>
      </div>
    `
    )
    .join("");
});
