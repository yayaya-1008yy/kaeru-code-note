import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let outfits = [];

let favoriteOutfits =
  JSON.parse(localStorage.getItem("favoriteOutfits")) || [];

let favoriteOnly = false;

let sortMode = "new";

const outfitList =
  document.getElementById("outfitList");

const searchInput =
  document.getElementById("searchInput");

const popularTags =
  document.getElementById("popularTags");

const favoriteOnlyBtn =
  document.getElementById("favoriteOnlyBtn");

const newSortBtn =
  document.getElementById("newSortBtn");

const popularSortBtn =
  document.getElementById("popularSortBtn");

function getMainImage(outfit) {

  if (
    outfit.images &&
    outfit.images.length > 0
  ) {
    return outfit.images[0];
  }

  return outfit.image;
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

      tagCount[tag] =
        (tagCount[tag] || 0) + 1;

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

    button.textContent =
      `#${tag} (${count})`;

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
        Math.max(
          (outfit.favoriteCount || 1) - 1,
          0
        );

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

    renderOutfits(
      searchInput
        ? searchInput.value
        : ""
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

  const filteredOutfits =
    outfits.filter(outfit => {

      const titleText =
        (outfit.title || "").toLowerCase();

      const heightText =
        (outfit.height || "").toLowerCase();

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
        `${titleText} ${heightText} ${tagText} ${itemText}`;

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

  if (outfits.length === 0) {

    outfitList.innerHTML =
      `<p class="empty">まだ投稿がありません。</p>`;

    return;
  }

  if (filteredOutfits.length === 0) {

    outfitList.innerHTML =
      `<p class="empty">検索に合う投稿がありません。</p>`;

    return;
  }

  filteredOutfits.forEach(outfit => {

    const card =
      document.createElement("article");

    card.className = "post-card";

    const tagHtml =
      outfit.tags &&
      outfit.tags.length
        ? outfit.tags.map(tag =>
            `<span class="tag" onclick="event.stopPropagation(); searchByTag('${tag}')">#${tag}</span>`
          ).join("")
        : "";

    const imageCount =
      outfit.images &&
      outfit.images.length
        ? outfit.images.length
        : 1;

    const itemCount =
      outfit.items &&
      outfit.items.length
        ? outfit.items.length
        : 0;

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
            class="favorite-btn mini ${favoriteOutfits.includes(outfit.id) ? 'active' : ''}"
            onclick="event.stopPropagation(); toggleFavorite(${outfit.id})"
          >

            ${favoriteOutfits.includes(outfit.id)
              ? '♥'
              : '♡'}

          </button>

        </div>

        <p class="card-height">
          ${outfit.height || ""}
        </p>

        <div class="card-tags">
          ${tagHtml}
        </div>

        <p class="card-info">
          ♥ ${outfit.favoriteCount || 0}
          ／ 画像 ${imageCount}枚
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
      searchInput
        ? searchInput.value
        : ""
    );

  });

}

if (newSortBtn && popularSortBtn) {

  newSortBtn.addEventListener("click", () => {

    sortMode = "new";

    newSortBtn.classList.add("active");

    popularSortBtn.classList.remove("active");

    renderOutfits(
      searchInput
        ? searchInput.value
        : ""
    );

  });

  popularSortBtn.addEventListener("click", () => {

    sortMode = "popular";

    popularSortBtn.classList.add("active");

    newSortBtn.classList.remove("active");

    renderOutfits(
      searchInput
        ? searchInput.value
        : ""
    );

  });

}

window.toggleFavorite =
  toggleFavorite;

window.searchByTag =
  searchByTag;

loadOutfits();