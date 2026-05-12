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
let profileCache = {};

let favoriteOutfits =
  JSON.parse(localStorage.getItem("favoriteOutfits")) || [];

let favoriteOnly = false;
let sortMode = "new";

const outfitList = document.getElementById("outfitList");
const searchInput = document.getElementById("searchInput");
const popularTags = document.getElementById("popularTags");
const favoriteOnlyBtn = document.getElementById("favoriteOnlyBtn");
const newSortBtn = document.getElementById("newSortBtn");
const popularSortBtn = document.getElementById("popularSortBtn");
const trendingSortBtn = document.getElementById("trendingSortBtn");

const style = document.createElement("style");

style.textContent = `

.card-user-row {

  display: flex;

  align-items: center;

  gap: 6px;

  margin: 8px 0 10px;
}

.card-user-mini {

  width: 18px;

  height: 18px;

  min-width: 18px;

  border-radius: 999px;

  overflow: hidden;

  flex-shrink: 0;

  background: #f4fbff;

  border: 1px solid #e8f7fc;
}

.card-user-icon {

  width: 100%;

  height: 100%;

  object-fit: cover;

  display: block;
}

.card-user-icon-fallback {

  width: 100%;

  height: 100%;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 8px;

  color: #65c5df;

  font-weight: 900;
}

.card-user-link {

  color: #74cde6;

  font-size: 12px;

  font-weight: 900;

  text-decoration: none;
}

`;

document.head.appendChild(style);

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

  if (outfitList) {

    outfitList.innerHTML =
      `<p class="empty">読み込み中...</p>`;

  }

  try {

    const q =
      query(
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
        outfit.userId || outfit.ownerId;

      const profile =
        await getUserProfile(uid);

      outfit.profileIcon =
        profile && profile.iconImage
          ? profile.iconImage
          : "";

      outfit.profileName =
        profile && profile.displayName
          ? profile.displayName
          : outfit.userName || "NO NAME";

    }

    renderOutfits();

  } catch (error) {

    console.error(error);

    if (outfitList) {

      outfitList.innerHTML = `
        <p class="empty">
          投稿の読み込みに失敗しました。
        </p>
      `;

    }

  }

}

async function toggleFavorite(id) {

  const outfit =
    outfits.find(item => item.id === id);

  if (!outfit) return;

  const alreadyFavorite =
    favoriteOutfits.includes(id);

  try {

    const outfitRef =
      doc(db, "outfits", outfit.firebaseId);

    if (alreadyFavorite) {

      favoriteOutfits =
        favoriteOutfits.filter(item => item !== id);

      await updateDoc(outfitRef, {
        favoriteCount: increment(-1)
      });

      outfit.favoriteCount =
        Math.max((outfit.favoriteCount || 1) - 1, 0);

    } else {

      favoriteOutfits.push(id);

      await updateDoc(outfitRef, {
        favoriteCount: increment(1)
      });

      outfit.favoriteCount =
        (outfit.favoriteCount || 0) + 1;

    }

    localStorage.setItem(
      "favoriteOutfits",
      JSON.stringify(favoriteOutfits)
    );

    renderOutfits();

  } catch (error) {

    console.error(error);

  }

}

function renderOutfits() {

  if (!outfitList) return;

  outfitList.innerHTML = "";

  outfits.forEach(outfit => {

    const card =
      document.createElement("article");

    card.className = "post-card";

    const uid =
      outfit.userId || outfit.ownerId;

    const userIconHtml =

      outfit.profileIcon

        ? `

          <div class="card-user-mini">

            <img
              class="card-user-icon"
              src="${outfit.profileIcon}"
              alt=""
            >

          </div>

        `

        : `

          <div class="card-user-mini">

            <div class="card-user-icon-fallback">
              ☻
            </div>

          </div>

        `;

    const imageCount =
      outfit.images &&
      outfit.images.length
        ? outfit.images.length
        : 1;

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

        </div>

        <div class="card-user-row">

          ${userIconHtml}

          <a
            class="card-user-link"
            href="user.html?uid=${uid}"
          >
            ${outfit.profileName || "NO NAME"}
          </a>

        </div>

        <p class="card-info">

          👀 ${outfit.viewCount || 0}

          ／ ♥ ${outfit.favoriteCount || 0}

        </p>

      </div>

    `;

    outfitList.appendChild(card);

  });

}

window.toggleFavorite = toggleFavorite;

loadOutfits();