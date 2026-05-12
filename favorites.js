import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let outfits = [];

let favoriteOutfits =
  JSON.parse(localStorage.getItem("favoriteOutfits")) || [];

const favoriteList =
  document.getElementById("favoriteList");

const favoriteSearchInput =
  document.getElementById("favoriteSearchInput");

const profileCache = {};

function saveFavorites() {
  localStorage.setItem(
    "favoriteOutfits",
    JSON.stringify(favoriteOutfits)
  );
}

function getMainImage(outfit) {
  if (outfit.images && outfit.images.length > 0) {
    return outfit.images[0];
  }

  if (outfit.image) {
    return outfit.image;
  }

  if (outfit.imageUrl) {
    return outfit.imageUrl;
  }

  if (outfit.mainImage) {
    return outfit.mainImage;
  }

  return "https://placehold.co/600x800?text=NO+IMAGE";
}

async function getUserProfile(uid) {
  if (!uid) return null;

  if (profileCache[uid]) {
    return profileCache[uid];
  }

  try {
    const profileRef =
      doc(db, "profiles", uid);

    const profileSnap =
      await getDoc(profileRef);

    if (!profileSnap.exists()) {
      profileCache[uid] = null;
      return null;
    }

    const profile =
      profileSnap.data();

    profileCache[uid] = profile;

    return profile;

  } catch (error) {
    console.error(error);
    return null;
  }
}

async function loadOutfits() {
  favoriteList.innerHTML =
    `<p class="empty">読み込み中...</p>`;

  try {
    const q = query(
      collection(db, "outfits"),
      orderBy("createdAt", "desc")
    );

    const snapshot =
      await getDocs(q);

    outfits =
      snapshot.docs.map(docItem => ({
        firebaseId: docItem.id,
        ...docItem.data()
      }));

    for (const outfit of outfits) {
      const uid =
        outfit.ownerId || outfit.userId;

      const profile =
        await getUserProfile(uid);

      outfit.profileIcon =
        profile?.iconImage || "";

      outfit.profileName =
        profile?.displayName ||
        outfit.userName ||
        "NO NAME";
    }

    renderFavorites();

  } catch (error) {
    console.error(error);

    favoriteList.innerHTML = `
      <p class="empty">
        お気に入りの読み込みに失敗しました。
      </p>
    `;
  }
}

async function toggleFavorite(id) {
  const outfit =
    outfits.find(item => item.id === id);

  if (!outfit) return;

  const outfitRef =
    doc(db, "outfits", outfit.firebaseId);

  try {
    favoriteOutfits =
      favoriteOutfits.filter(item => item !== id);

    await updateDoc(outfitRef, {
      favoriteCount: increment(-1)
    });

    outfit.favoriteCount =
      Math.max((outfit.favoriteCount || 1) - 1, 0);

    saveFavorites();
    renderFavorites(
      favoriteSearchInput ? favoriteSearchInput.value : ""
    );

  } catch (error) {
    console.error(error);
    alert("お気に入りの更新に失敗しました");
  }
}

function renderFavorites(keyword = "") {
  favoriteList.innerHTML = "";

  const searchWord =
    keyword.toLowerCase().trim();

  const filtered =
    outfits.filter(outfit => {
      const isFavorite =
        favoriteOutfits.includes(outfit.id);

      const titleText =
        outfit.title || "";

      const heightText =
        outfit.height || "";

      const userText =
        outfit.profileName || outfit.userName || "";

      const tagText =
        outfit.tags
          ? outfit.tags.join(" ")
          : "";

      const itemText =
        outfit.items
          ? outfit.items.map(item =>
              `${item.name || ""} ${item.code || ""}`
            ).join(" ")
          : "";

      const allText =
        `${titleText} ${heightText} ${userText} ${tagText} ${itemText}`
          .toLowerCase();

      return (
        isFavorite &&
        allText.includes(searchWord)
      );
    });

  if (filtered.length === 0) {
    favoriteList.innerHTML = `
      <p class="empty">
        お気に入りがありません。
      </p>
    `;

    return;
  }

  filtered.forEach(outfit => {
    const card =
      document.createElement("article");

    card.className =
      "post-card";

    const uid =
      outfit.ownerId || outfit.userId;

    const imageCount =
      outfit.images && outfit.images.length
        ? outfit.images.length
        : 1;

    const itemCount =
      outfit.items && outfit.items.length
        ? outfit.items.length
        : 0;

    const tagHtml =
      outfit.tags && outfit.tags.length
        ? outfit.tags.map(tag =>
            `<span class="tag">#${tag}</span>`
          ).join("")
        : "";

    card.innerHTML = `
      <div class="card-image-wrap">

        <img
          src="${getMainImage(outfit)}"
          alt="${outfit.title || "コーデ画像"}"
        >

        <div class="image-count-badge">
          📷 ${imageCount}
        </div>

      </div>

      <div class="card-body">

        <div class="card-title-row">

          <h3>
            ${outfit.title || "無題のコーデ"}
          </h3>

          <button
            class="favorite-btn mini active"
            onclick="
              event.stopPropagation();
              toggleFavorite(${outfit.id})
            "
          >
            ♥
          </button>

        </div>

        <p class="card-height">
          ${outfit.height || ""}
        </p>

        <p class="card-info">
          ${outfit.profileName || "NO NAME"}
          ／ ♥ ${outfit.favoriteCount || 0}
          ／ 📷 ${imageCount}
          ／ アイテム ${itemCount}点
        </p>

        <div class="card-tags">
          ${tagHtml}
        </div>

        <div class="card-actions">

          <button
            class="small-btn"
            onclick="
              event.stopPropagation();
              location.href='outfit.html?id=${outfit.id}'
            "
          >
            詳しく見る
          </button>

          ${
            uid
              ? `
                <button
                  class="small-btn"
                  onclick="
                    event.stopPropagation();
                    location.href='user.html?uid=${uid}'
                  "
                >
                  投稿者を見る
                </button>
              `
              : ""
          }

        </div>

      </div>
    `;

    card.addEventListener("click", () => {
      location.href =
        `outfit.html?id=${outfit.id}`;
    });

    favoriteList.appendChild(card);
  });
}

if (favoriteSearchInput) {
  favoriteSearchInput.addEventListener("input", () => {
    renderFavorites(favoriteSearchInput.value);
  });
}

window.toggleFavorite = toggleFavorite;

loadOutfits();