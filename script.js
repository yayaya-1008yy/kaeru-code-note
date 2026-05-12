import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let outfits = [];
let profileCache = {};

const outfitList =
  document.getElementById("outfitList");

const style =
  document.createElement("style");

style.textContent = `

.card-user-row {

  display: flex;

  align-items: center;

  gap: 7px;

  margin: 8px 0 10px;
}

.card-user-mini {

  width: 20px;

  height: 20px;

  min-width: 20px;

  border-radius: 999px;

  overflow: hidden;

  background: #eef8fc;

  border: 1px solid #d9eef5;

  flex-shrink: 0;
}

.card-user-icon {

  width: 100%;

  height: 100%;

  object-fit: cover;

  object-position: center;

  display: block;
}

.card-user-icon-fallback {

  width: 100%;

  height: 100%;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 9px;

  color: #70c9df;

  font-weight: 900;
}

.card-user-link {

  color: #74cde6;

  font-size: 12px;

  font-weight: 900;

  text-decoration: none;
}

.card-tags {

  display: flex;

  flex-wrap: wrap;

  gap: 6px;

  margin: 10px 0;
}

.tag {

  background: #f3fbff;

  color: #6cc8df;

  border-radius: 999px;

  padding: 4px 8px;

  font-size: 11px;

  font-weight: 700;
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

  if (!outfitList) return;

  outfitList.innerHTML =
    `<p class="empty">読み込み中...</p>`;

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
        profile?.iconImage || "";

      outfit.profileName =
        profile?.displayName ||
        outfit.userName ||
        "NO NAME";

    }

    renderOutfits();

  } catch (error) {

    console.error(error);

    outfitList.innerHTML =
      `<p class="empty">読み込み失敗</p>`;

  }

}

function renderOutfits() {

  if (!outfitList) return;

  outfitList.innerHTML = "";

  if (outfits.length === 0) {

    outfitList.innerHTML =
      `<p class="empty">まだ投稿がありません。</p>`;

    return;

  }

  outfits.forEach(outfit => {

    const card =
      document.createElement("article");

    card.className =
      "post-card";

    const uid =
      outfit.userId || outfit.ownerId;

    const imageCount =
      outfit.images &&
      outfit.images.length
        ? outfit.images.length
        : 1;

    const tagHtml =
      outfit.tags &&
      outfit.tags.length
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

        <h3>
          ${outfit.title || "無題のコーデ"}
        </h3>

        <div class="card-user-row">

          <div class="card-user-mini">

            ${
              outfit.profileIcon

                ? `
                  <img
                    class="card-user-icon"
                    src="${outfit.profileIcon}"
                    alt=""
                  >
                `

                : `
                  <div class="card-user-icon-fallback">
                    ☻
                  </div>
                `
            }

          </div>

          <a
            class="card-user-link"
            href="user.html?uid=${uid}"
            onclick="event.stopPropagation();"
          >
            ${outfit.profileName}
          </a>

        </div>

        <div class="card-tags">
          ${tagHtml}
        </div>

        <p class="card-info">

          👀 ${outfit.viewCount || 0}

          ／ ♥ ${outfit.favoriteCount || 0}

        </p>

      </div>

    `;

    card.addEventListener("click", () => {

      location.href =
        `outfit.html?id=${outfit.id}`;

    });

    outfitList.appendChild(card);

  });

}

loadOutfits();