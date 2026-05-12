import { db, auth } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  increment,
  where,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let outfits = [];
let profileCache = {};
let followingIds = [];

let favoriteOutfits =
  JSON.parse(localStorage.getItem("favoriteOutfits")) || [];

let favoriteOnly = false;
let sortMode = "new";

const outfitList = document.getElementById("outfitList");
const searchInput = document.getElementById("searchInput");

const popularTags =
  document.getElementById("popularTags") ||
  document.getElementById("trendTags");

const favoriteOnlyBtn = document.getElementById("favoriteOnlyBtn");
const newSortBtn = document.getElementById("newSortBtn");
const popularSortBtn = document.getElementById("popularSortBtn");
const trendingSortBtn = document.getElementById("trendingSortBtn");

const isHomeFeed =
  document.querySelector(".follow-feed-section") !== null;

const style = document.createElement("style");

style.textContent = `
.card-user-row {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 8px 0 10px;
}

.card-user-mini {
  width: 22px;
  height: 22px;
  min-width: 22px;
  border-radius: 999px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d9eef5;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-user-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  border-radius: 999px;
  background: #ffffff;
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
    const profileRef = doc(db, "profiles", uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      profileCache[uid] = null;
      return null;
    }

    const profile = profileSnap.data();
    profileCache[uid] = profile;

    return profile;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function loadFollowingIds(user) {
  followingIds = [];

  if (!user) return;

  const q = query(
    collection(db, "follows"),
    where("followerId", "==", user.uid)
  );

  const snap = await getDocs(q);

  followingIds =
    snap.docs.map(docItem => docItem.data().followingId);
}

async function loadOutfits() {
  if (outfitList) {
    outfitList.innerHTML =
      `<p class="empty">読み込み中...</p>`;
  }

  try {
    const q = query(
      collection(db, "outfits"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

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

    renderPopularTags();

    const params =
      new URLSearchParams(window.location.search);

    const tag =
      params.get("tag");

    const tagPageTitle =
      document.getElementById("tagPageTitle");

    if (tag && tagPageTitle) {
      tagPageTitle.textContent =
        `#${tag} のコーデ一覧`;
    }

    if (tag && searchInput) {
      searchInput.value = tag;
      renderOutfits(tag);
    } else {
      renderOutfits();
    }

  } catch (error) {
    console.error(error);

    if (outfitList) {
      outfitList.innerHTML = `
        <p class="empty">
          投稿の読み込みに失敗しました。<br>
          少し時間をおいて再読み込みしてください。
        </p>
      `;
    }
  }
}

function renderPopularTags() {
  if (!popularTags) return;

  popularTags.innerHTML = "";

  const tagCount = {};

  outfits.forEach(outfit => {
    if (!outfit.tags) return;

    outfit.tags.forEach(tag => {
      const cleanTag =
        String(tag).replace("#", "").trim();

      if (!cleanTag) return;

      tagCount[cleanTag] =
        (tagCount[cleanTag] || 0) + 1;
    });
  });

  const sortedTags =
    Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1]);

  if (sortedTags.length === 0) {
    popularTags.innerHTML =
      `<p class="empty">まだタグがありません。</p>`;
    return;
  }

  sortedTags.forEach(([tag, count]) => {
    const button =
      document.createElement("button");

    button.className = "popular-tag";
    button.textContent = `#${tag} (${count})`;

    button.addEventListener("click", () => {
      location.href =
        `posts.html?tag=${encodeURIComponent(tag)}`;
    });

    popularTags.appendChild(button);
  });
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

      const ownerUid =
        outfit.ownerId || outfit.userId;

      if (
        auth.currentUser &&
        ownerUid &&
        auth.currentUser.uid !== ownerUid
      ) {
        const notificationId =
          `favorite_${auth.currentUser.uid}_${outfit.id}_${Date.now()}`;

        await setDoc(
          doc(db, "notifications", notificationId),
          {
            type: "favorite",
            fromUserId: auth.currentUser.uid,
            toUserId: ownerUid,
            outfitId: outfit.id,
            outfitTitle: outfit.title || "無題のコーデ",
            createdAt: serverTimestamp()
          }
        );
      }
    }

    localStorage.setItem(
      "favoriteOutfits",
      JSON.stringify(favoriteOutfits)
    );

    renderOutfits(
      searchInput ? searchInput.value : ""
    );

  } catch (error) {
    console.error(error);
    alert("お気に入り更新に失敗しました");
  }
}

function renderOutfits(keyword = "") {
  if (!outfitList) return;

  outfitList.innerHTML = "";

  const searchWord =
    keyword.trim().toLowerCase();

  let filteredOutfits =
    outfits.filter(outfit => {
      const ownerUid =
        outfit.ownerId || outfit.userId;

      if (isHomeFeed) {
        return followingIds.includes(ownerUid) ||
          followingIds.includes(outfit.userId) ||
          followingIds.includes(outfit.ownerId);
      }

      return true;
    });

  filteredOutfits =
    filteredOutfits.filter(outfit => {
      const titleText =
        (outfit.title || "").toLowerCase();

      const heightText =
        (outfit.height || "").toLowerCase();

      const userText =
        (outfit.profileName || outfit.userName || "").toLowerCase();

      const tagText =
        outfit.tags
          ? outfit.tags.join(" ").toLowerCase()
          : "";

      const itemText =
        outfit.items
          ? outfit.items.map(item =>
              `${item.name || ""} ${item.code || ""}`
            ).join(" ").toLowerCase()
          : "";

      const allText =
        `${titleText} ${heightText} ${userText} ${tagText} ${itemText}`;

      const matchesSearch =
        allText.includes(searchWord);

      if (favoriteOnly) {
        return (
          matchesSearch &&
          favoriteOutfits.includes(outfit.id)
        );
      }

      return matchesSearch;
    });

  if (sortMode === "popular") {
    filteredOutfits.sort((a, b) => {
      return (b.favoriteCount || 0)
        - (a.favoriteCount || 0);
    });
  }

  if (sortMode === "trending") {
    filteredOutfits.sort((a, b) => {
      const aScore =
        (a.viewCount || 0) +
        ((a.favoriteCount || 0) * 3);

      const bScore =
        (b.viewCount || 0) +
        ((b.favoriteCount || 0) * 3);

      return bScore - aScore;
    });
  }

  if (outfits.length === 0) {
    outfitList.innerHTML =
      `<p class="empty">まだ投稿がありません。</p>`;
    return;
  }

  if (isHomeFeed && followingIds.length === 0) {
    outfitList.innerHTML = `
      <p class="empty">
        まだ誰もフォローしていません。<br>
        気になるユーザーをフォローすると、ここに新着が出ます。
      </p>
    `;
    return;
  }

  if (filteredOutfits.length === 0) {
    outfitList.innerHTML =
      `<p class="empty">表示できる投稿がありません。</p>`;
    return;
  }

  filteredOutfits.forEach(outfit => {
    const card =
      document.createElement("article");

    card.className = "post-card";

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
            `<span class="tag" onclick="event.stopPropagation(); searchByTag('${tag}')">#${tag}</span>`
          ).join("")
        : "";

    card.innerHTML = `
      <div class="card-image-wrap">
        <img
          src="${getMainImage(outfit)}"
          alt="${outfit.title || "コーデ画像"}"
          loading="eager"
          decoding="sync"
          style="opacity:1;"
        >

        <div class="image-count-badge">
          📷 ${imageCount}
        </div>
      </div>

      <div class="card-body">
        <div class="card-title-row">
          <h3>${outfit.title || "無題のコーデ"}</h3>

          <button
            class="favorite-btn mini ${favoriteOutfits.includes(outfit.id) ? "active" : ""}"
            onclick="event.stopPropagation(); toggleFavorite(${outfit.id})"
          >
            ${favoriteOutfits.includes(outfit.id) ? "♥" : "♡"}
          </button>
        </div>

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
            ${outfit.profileName || "NO NAME"}
          </a>
        </div>

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
          onclick="event.stopPropagation(); location.href='outfit.html?id=${outfit.id}'"
        >
          詳しく見る
        </button>
      </div>
    `;

    card.addEventListener("click", () => {
      location.href =
        `outfit.html?id=${outfit.id}`;
    });

    outfitList.appendChild(card);
  });
}

function searchByTag(tag) {
  location.href =
    `posts.html?tag=${encodeURIComponent(tag)}`;
}

function resetSortButtons() {
  if (newSortBtn) newSortBtn.classList.remove("active");
  if (popularSortBtn) popularSortBtn.classList.remove("active");
  if (trendingSortBtn) trendingSortBtn.classList.remove("active");
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    renderOutfits(searchInput.value);
  });
}

if (favoriteOnlyBtn) {
  favoriteOnlyBtn.addEventListener("click", () => {
    favoriteOnly = !favoriteOnly;

    favoriteOnlyBtn.textContent =
      favoriteOnly
        ? "♡ 全投稿を表示"
        : "♡ お気に入りだけ表示";

    favoriteOnlyBtn.classList.toggle(
      "active",
      favoriteOnly
    );

    renderOutfits(
      searchInput ? searchInput.value : ""
    );
  });
}

if (newSortBtn) {
  newSortBtn.addEventListener("click", () => {
    sortMode = "new";
    resetSortButtons();
    newSortBtn.classList.add("active");
    renderOutfits(searchInput ? searchInput.value : "");
  });
}

if (popularSortBtn) {
  popularSortBtn.addEventListener("click", () => {
    sortMode = "popular";
    resetSortButtons();
    popularSortBtn.classList.add("active");
    renderOutfits(searchInput ? searchInput.value : "");
  });
}

if (trendingSortBtn) {
  trendingSortBtn.addEventListener("click", () => {
    sortMode = "trending";
    resetSortButtons();
    trendingSortBtn.classList.add("active");
    renderOutfits(searchInput ? searchInput.value : "");
  });
}

window.toggleFavorite = toggleFavorite;
window.searchByTag = searchByTag;

if (isHomeFeed) {
  onAuthStateChanged(auth, async user => {
    if (!user) {
      if (outfitList) {
        outfitList.innerHTML = `
          <p class="empty">
            ログインすると、フォロー中の新着コーデが表示されます。
          </p>
        `;
      }

      await loadOutfits();
      return;
    }

    await loadFollowingIds(user);
    await loadOutfits();
  });
} else {
  loadOutfits();
}