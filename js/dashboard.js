import { auth, database } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const userInfo = document.getElementById("user-info");
const cardContainer = document.getElementById("card-container");
const logoutBtn = document.getElementById("logout");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    const userSnap = await get(ref(database, "users/" + user.uid));
    const userData = userSnap.val();
    userInfo.textContent = `${userData.username} — Points: ${userData.points}`;

    loadUserCards(userData.cards || {});
  } else {
    window.location.href = "index.html";
  }
});

function loadUserCards(userCards) {
  cardContainer.innerHTML = "";

  if (!userCards || Object.keys(userCards).length === 0) {
    cardContainer.innerHTML = "<p>You don't own any cards yet!</p>";
    return;
  }

  // Fetch all card details to get images
  onValue(ref(database, "cards"), (snapshot) => {
    const allCards = snapshot.val();

    for (const [id, quantity] of Object.entries(userCards)) {
      const cardData = allCards[id];
      if (!cardData) continue; // safety check

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

// Logout button
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});
