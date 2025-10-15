import { database } from "./firebase.js";
import { ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const cardList = document.getElementById("card-list");
const countdownEl = document.getElementById("countdown");
const forceBtn = document.getElementById("force-update");

let intervalSeconds = 180; // Every 3 minutes
let countdown = intervalSeconds;

// Load and display all cards
const cardsRef = ref(database, "cards");
onValue(cardsRef, (snapshot) => {
  const cards = snapshot.val();
  cardList.innerHTML = "";
  for (const [id, data] of Object.entries(cards)) {
    const div = document.createElement("div");
    div.classList.add("card-item");
    div.innerHTML = `
      <h3>${data.name}</h3>
      <p>Current Price: ${data.price} pts</p>
      <p>Stock: ${data.stock}</p>
    `;
    cardList.appendChild(div);
  }
});

// Random price update function
async function updatePrices() {
  const snapshot = await get(cardsRef);
  const cards = snapshot.val();

  for (const [id, card] of Object.entries(cards)) {
    // Randomly increase or decrease by 10–20%
    const direction = Math.random() < 0.5 ? -1 : 1;
    const percentChange = Math.random() * 0.1 + 0.1; // between 10%–20%
    let newPrice = Math.round(card.price + card.price * percentChange * direction);

    // Keep price in safe range
    if (newPrice < 10) newPrice = 10;
    if (newPrice > 500) newPrice = 500;

    await update(ref(database, "cards/" + id), {
      price: newPrice,
      lastChange: direction > 0 ? "up" : "down"
    });
  }

  console.log("Prices updated!");
  countdown = intervalSeconds; // Reset countdown
}

// Countdown + automatic updating
setInterval(() => {
  countdown--;
  countdownEl.textContent = countdown;
  if (countdown <= 0) {
    updatePrices();
  }
}, 1000);

// Manual force update
forceBtn.addEventListener("click", updatePrices);
