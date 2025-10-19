import { database } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const profileList = document.getElementById("profile-list");

const usersRef = ref(database, "users");
onValue(usersRef, (snapshot) => {
  const users = snapshot.val();
  if (!users) {
    profileList.innerHTML = "<p>No current results.</p>";
    return;
  }

  const userArray = Object.entries(users).map(([uid, data]) => ({
    uid,
    name: data.username || "Unknown Player",
    points: data.points || 0,
    pfp: data.profilePicture || "images/default-pfp.png"
  }));

  // Sort alphabetically by name
  userArray.sort((a, b) => b.points - a.points);

  profileList.innerHTML = userArray
    .map(
      (u) => `
        <div class="profile-card">
          <img src="${u.pfp}" alt="${u.name}'s picture" class="profile-pic-square">
          <div class="profile-info">
            <a href="profile.html?id=${u.uid}" class="profile-name">${u.name}</a>
            <p class="profile-points">$${u.points}</p>
          </div>
        </div>
      `
    )
    .join("");
});
