import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params =
  new URLSearchParams(window.location.search);

const uid =
  params.get("uid");

const userProfileArea =
  document.getElementById("userProfileArea");

const userOutfitList =
  document.getElementById("userOutfitList");

let userOutfits = [];

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

async function loadUserPage() {
  if (!uid) {
    userProfileArea.innerHTML =
      `<p class="empty">ユーザーが見つかりません。</p>`;
    return;
  }

  await loadUserOutfits();
  await loadProfile();
}

async function loadProfile() {
  try {
    const profileRef =
      doc(db, "profiles", uid);

    const profileSnap =
      await getDoc(profileRef);

    let profile = {};

    if (profileSnap.exists()) {
      profile = profileSnap.data();
    }

    const name =
      profile.displayName || "NO NAME";

    const firstLetter =
      name.slice(0, 1);

    userProfileArea.innerHTML = `
      <section class="user-hero-card">

        <div class="user-avatar">
          ${firstLetter}
        </div>

        <div class="user-hero-main">

          <p class="eyebrow">
            USER PROFILE
          </p>

          <h1>
            ${name}
          </h1>

          <p class="user-bio">
            ${profile.bio || "自己紹介はまだありません。"}
          </p>

          <div class="user-stats">

            <div>
              <strong>${userOutfits.length}</strong>
              <span>POSTS</span>
            </div>

            ${profile.height ? `
              <div>
                <strong>${profile.height}</strong>
                <span>HEIGHT</span>
              </div>
            ` : ""}

            ${profile.usualSize ? `
              <div>
                <strong>${profile.usualSize}</strong>
                <span>SIZE</span>
              </div>
            ` : ""}

          </div>

        </div>

      </section>

      <section class="user-profile-details">

        ${profile.bodyType ? `
          <div>
            <span>体型・サイズ感</span>
            <strong>${profile.bodyType}</strong>
          </div>
        ` : ""}

        ${profile.favoriteStyle ? `
          <div>
            <span>好きな系統</span>
            <strong>${profile.favoriteStyle}</strong>
          </div>
        ` : ""}

        ${profile.favoriteColor ? `
          <div>
            <span>好きな色</span>
            <strong>${profile.favoriteColor}</strong>
          </div>
        ` : ""}

      </section>

      <div class="user-section-title">
        <p class="eyebrow">OUTFITS</p>
        <h2>投稿一覧</h2>
      </div>
    `;

  } catch (error) {
    console.error(error);

    userProfileArea.innerHTML =
      `<p class="empty">プロフィールを読み込めませんでした。</p>`;
  }
}

async function loadUserOutfits() {
  userOutfitList.innerHTML =
    `<p class="empty">投稿を読み込み中...</p>`;

  try {
    const q =
      query(
        collection(db, "outfits"),
        orderBy("createdAt", "desc")
      );

    const snapshot =
      await getDocs(q);

    userOutfits =
      snapshot.docs
        .map(docItem => ({
          firebaseId: docItem.id,
          ...docItem.data()
        }))
        .filter(outfit =>
          outfit.ownerId === uid ||
          outfit.userId === uid
        );

    if (userOutfits.length === 0) {
      userOutfitList.innerHTML =
        `<p class="empty">まだ投稿がありません。</p>`;
      return;
    }

    userOutfitList.innerHTML = "";

    userOutfits.forEach(outfit => {
      const card =
        document.createElement("article");

      card.className =
        "post-card";

      const imageCount =
        outfit.images && outfit.images.length
          ? outfit.images.length
          : 1;

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

          <div class="card-tags">
            ${tagHtml}
          </div>

          <p class="card-info">
            👀 ${outfit.viewCount || 0}
            ／ ♥ ${outfit.favoriteCount || 0}
            ／ 📷 ${imageCount}
          </p>

          <button
            class="small-btn full-btn"
            onclick="location.href='outfit.html?id=${outfit.id}'"
          >
            詳しく見る
          </button>
        </div>
      `;

      userOutfitList.appendChild(card);
    });

  } catch (error) {
    console.error(error);

    userOutfitList.innerHTML =
      `<p class="empty">投稿を読み込めませんでした。</p>`;
  }
}

loadUserPage();