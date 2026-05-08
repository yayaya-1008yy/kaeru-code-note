import {
  db,
  auth
} from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const outfitList = document.getElementById("outfitList");

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

  return "https://placehold.co/600x800?text=NO+IMAGE";
}

async function loadMyOutfits(user) {
  outfitList.innerHTML =
    `<p class="empty">読み込み中...</p>`;

  try {
    const q = query(
      collection(db, "outfits"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const myOutfits = snapshot.docs
      .map(docItem => ({
        firebaseId: docItem.id,
        ...docItem.data()
      }))
      .filter(outfit =>
        outfit.ownerId === user.uid ||
        outfit.userId === user.uid
      );

    if (myOutfits.length === 0) {
      outfitList.innerHTML =
        `<p class="empty">まだ自分の投稿がありません。</p>`;
      return;
    }

    outfitList.innerHTML = "";

    myOutfits.forEach(outfit => {
      const card = document.createElement("article");
      card.className = "post-card";

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
          <h3>${outfit.title || "無題のコーデ"}</h3>

          <p class="card-height">
            ${outfit.height || ""}
          </p>

          <div class="card-tags">
            ${tagHtml}
          </div>

          <p class="card-info">
            👀 ${outfit.viewCount || 0}
            ／ ♥ ${outfit.favoriteCount || 0}
            ／ 📷 ${imageCount}
            ／ アイテム ${itemCount}点
          </p>

          <button
            class="small-btn full-btn"
            onclick="location.href='outfit.html?id=${outfit.id}'"
          >
            詳しく見る
          </button>

          <button
            class="small-btn full-btn"
            onclick="location.href='edit.html?id=${outfit.id}'"
          >
            編集する
          </button>
        </div>
      `;

      outfitList.appendChild(card);
    });

  } catch (error) {
    console.error(error);
    outfitList.innerHTML =
      `<p class="empty">自分の投稿を読み込めませんでした。</p>`;
  }
}

onAuthStateChanged(auth, user => {
  if (!user) {
    outfitList.innerHTML =
      `<p class="empty">ログインすると自分の投稿が見れます。</p>`;
    return;
  }

  loadMyOutfits(user);
});