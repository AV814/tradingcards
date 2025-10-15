import { db } from "./firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// --- CONFIGURATION ---
const fluctuationInterval = 30000; // 30 seconds (you can change this)
const maxChangePercent = 5; // +/-5% per update

// --- FLUCTUATION LOGIC ---
async function fluctuatePrices() {
  const cardsRef = ref(db, "cards/");
  const snapshot = await get(cardsRef);
  if (!snapshot.exists()) return;

  const cards = snapshot.val();
  for (const [cardId, data] of Object.entries(cards)) {
    const oldPrice = parseFloat(data.price);
    const original = parseFloat(data.original_price);

    // Random % change between -maxChangePercent and +maxChangePercent
    const changePercent = (Math.random() * 2 - 1) * maxChangePercent;
    let newPrice = oldPrice + (oldPrice * changePercent) / 100;

    // Price floor and rounding
    const minPrice = original * 0.3;
    newPrice = Math.max(minPrice, Math.round(newPrice));

    // Update Firebase
    const cardRef = ref(db, `cards/${cardId}`);
    await update(cardRef, { price: newPrice });

    console.log(`${data.name} price updated: ${oldPrice} → ${newPrice}`);
  }
}

// --- LOOP ---
setInterval(fluctuatePrices, fluctuationInterval);
console.log("💹 Price fluctuation system started...");
