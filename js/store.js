import { auth, db } from "./firebase.js";
import {
  ref,
  onValue,
  get,
  update,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const cardsContainer = document.getElementById("cardsContainer");
const pointsDisplay = document.getElementById("pointsDisplay");
let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  loadUserData();
  loadCards();
});

// Load and display user info
async function loadUserData() {
  const userRef = ref(db, "users/" + currentUser.uid);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    pointsDisplay.textContent = `Your Points: ${data.points}`;
  }
}

// Load all cards (live updates)
function loadCards() {
  const cardsRef = ref(db, "cards/");
  onValue(cardsRef, (snapshot) => {
    const cards = snapshot.val();
    cardsContainer.innerHTML = "";

    for (const [id, card] of Object.entries(cards)) {
      const cardDiv = document.createElement("div");
      cardDiv.classList.add("card-item");
      cardDiv.innerHTML = `
        <h3>${card.name}</h3>
        <p>💲Price: ${card.price}</p>
        <p>📦 Stock: ${card.stock}</p>
        <button data-id="${id}" data-action="buy">Buy</button>
        <button data-id="${id}" data-action="sell">Sell</button>
      `;
      cardsContainer.appendChild(cardDiv);
    }

    // Re-attach event listeners each time data updates
    document.querySelectorAll("button").forEach((btn) => {
      btn.onclick = handleTransaction;
    });
  });
}

// Handle Buy/Sell
async function handleTransaction(e) {
  const action = e.target.dataset.action;
  const id = e.target.dataset.id;
  const userRef = ref(db, "users/" + currentUser.uid);
  const cardRef = ref(db, "cards/" + id);

  const [userSnap, cardSnap] = await Promise.all([get(userRef), get(cardRef)]);
  if (!userSnap.exists() || !cardSnap.exists()) return;

  const userData = userSnap.val();
  const cardData = cardSnap.val();
  let userPoints = parseFloat(userData.points);
  let stock = parseInt(cardData.stock);
  const price = parseFloat(cardData.price);

  if (action === "buy") {
    if (userPoints < price) {
      alert("Not enough points!");
      return;
    }
    if (stock <= 0) {
      alert("Out of stock!");
      return;
    }

    userPoints -= price;
    stock -= 1;

    await update(userRef, {
      points: userPoints,
      [`inventory/${id}`]: (userData.inventory?.[id] || 0) + 1,
    });

    await update(cardRef, { stock: stock });
  } else if (action === "sell") {
    if (!userData.inventory?.[id] || userData.inventory[id] <= 0) {
      alert("You don't own this card!");
      return;
    }

    userPoints += price;
    stock += 1;

    await update(userRef, {
      points: userPoints,
      [`inventory/${id}`]: userData.inventory[id] - 1,
    });

    await update(cardRef, { stock: stock });
  }

  loadUserData(); // Refresh points display
}
