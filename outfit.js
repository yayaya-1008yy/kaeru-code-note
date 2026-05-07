import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let outfits = [];
let favoriteOutfits =
  JSON.parse(localStorage.getItem("favoriteOutfits")) || [];

const params = new URLSearchParams(window.location.search);
const outfitId = Number(params.get("id"));

const detailArea = document.getElementById("detailArea");

let currentImageIndex = 0;

function getImages(outfit) {
  if (outfit.images && outfit.images.length > 0) {
    return outfit.images;
  }

  return [outfit.image];
}

function saveFavorites() {
  localStorage.setItem(
    "favoriteOutfits",
    JSON.stringify(favoriteOutfits)
  );
}

function isFavorite(id) {
  return favoriteOutfits.includes(id);
}

function toggleFavorite(id) {
  if (isFavorite(id)) {
    favoriteOutfits =
      favoriteOutfits.filter(item => item !== id);
  } else {
    favoriteOutfits.push(id);
  }

  saveFavorites();
  renderDetail();
}

function changeMainImage(index) {
  currentImageIndex = index;
  renderDetail();
}

function copyCode(code) {
  navigator.clipboard.writeText(code);

  alert("商品コードをコピーしました！");
}

async function deleteOutfit(firebaseId) {
  if (!confirm("この投稿を削除しますか？")) {
    return;
  }

  try {
    await deleteDoc(
      doc(db, "outfits", firebaseId)
    );

    alert("投稿を削除しました");
    location.href = "posts.html";
  } catch (error) {
    console.error(error);
    alert("削除に失敗しました");
  }
}

async function loadOutfit() {
  const q =
    query(
      collection(db, "outfits"),
      orderBy("createdAt", "desc")
    );

  const snapshot = await getDocs(q);

  outfits =
    snapshot.docs.map(docItem => ({
      firebaseId: docItem.id,
      ...docItem.data()
    }));

  renderDetail();
}

function renderDetail() {
  const outfit =
    outfits.find(item => item.id === outfitId);

  if (!outfit) {
    detailArea.innerHTML = `
      <p class="empty">
        この投稿は見つかりませんでした。
      </p>

      <a class="back-link" href="posts.html">
        投稿一覧に戻る
      </a>
    `;

    return;
  }

  const images = getImages(outfit);

  if (currentImageIndex >= images.length) {
    currentImageIndex = 0;
  }

  const thumbnailHtml =
    images.map((image, index) => {
      return `
        <img
          class="thumbnail-image ${index === currentImageIndex ? 'active' : ''}"
          src="${image}"
          alt="サブ画像${index + 1}"
          onclick="changeMainImage(${index})"
        >
      `;
    }).join("");

  const tagHtml =
    outfit.tags && outfit.tags.length
      ? outfit.tags.map(tag =>
          `<span class="tag">#${tag}</span>`
        ).join("")
      : `<span class="tag">タグなし</span>`;

  const itemHtml =
    outfit.items.map((item, index) => {
      return `
        <div class="detail-item">

          <div class="detail-item-name">
            アイテム${index + 1}：${item.name}
          </div>

          <div class="detail-item-code">
            商品コード：
            <span class="item-code-text">
              ${item.code}
            </span>

            <button
              type="button"
              class="small-btn"
              onclick="copyCode('${item.code}')"
            >
              コピー
            </button>
          </div>

          <a
            class="main-btn"
            href="https://jp.shein.com/pdsearch/${item.code}/"
            target="_blank"
          >
            SHEINで見る
          </a>

        </div>
      `;
    }).join("");

  detailArea.innerHTML = `
    <img
      class="detail-image"
      src="${images[currentImageIndex]}"
      alt="${outfit.title}"
    >

    <div class="thumbnail-list">
      ${thumbnailHtml}
    </div>

    <div class="detail-title-row">

      <h1 class="detail-title">
        ${outfit.title}
      </h1>

      <button
        class="favorite-btn detail-favorite-btn ${isFavorite(outfit.id) ? 'active' : ''}"
        onclick="toggleFavorite(${outfit.id})"
      >
        ${isFavorite(outfit.id)
          ? '♥ 保存済み'
          : '♡ お気に入り'}
      </button>

      <a
        class="small-btn"
        href="edit.html?id=${outfit.id}"
      >
        編集する
      </a>

      <button
        class="delete-btn"
        onclick="deleteOutfit('${outfit.firebaseId}')"
      >
        削除する
      </button>

    </div>

    <p class="detail-height">
      身長：${outfit.height}
    </p>

    <p class="post-date">
      投稿日：${outfit.date || "投稿日なし"}
    </p>

    <div class="detail-tags">
      ${tagHtml}
    </div>

    <div class="detail-items">

      <h2>着用アイテム</h2>

      ${itemHtml}

    </div>
  `;
}

window.toggleFavorite = toggleFavorite;
window.changeMainImage = changeMainImage;
window.deleteOutfit = deleteOutfit;
window.copyCode = copyCode;

loadOutfit();