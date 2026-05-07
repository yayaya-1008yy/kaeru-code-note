import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let outfits = [];
let favoriteOutfits = JSON.parse(localStorage.getItem("favoriteOutfits")) || [];

let tags = [];
let items = [];
let favoriteOnly = false;

const tagInput = document.getElementById("tagInput");
const outfitList = document.getElementById("outfitList") || null;
const searchInput = document.getElementById("searchInput") || null;
const popularTags = document.getElementById("popularTags") || null;
const favoriteOnlyBtn = document.getElementById("favoriteOnlyBtn") || null;

function getMainImage(outfit) {
  if (outfit.images && outfit.images.length > 0) {
    return outfit.images[0];
  }
  return outfit.image;
}

async function loadOutfits() {
  const q = query(collection(db, "outfits"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  outfits = snapshot.docs.map(doc => ({
    firebaseId: doc.id,
    ...doc.data()
  }));

  renderPopularTags();
  renderOutfits();
}

if (tagInput) {
  tagInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = tagInput.value.trim();

      if (tag && !tags.includes(tag)) {
        tags.push(tag);
        tagInput.value = "";
        renderTags();
      }
    }
  });
}

if (searchInput) {
  searchInput.addEventListener("input", function() {
    renderOutfits(searchInput.value);
  });
}

if (favoriteOnlyBtn) {
  favoriteOnlyBtn.addEventListener("click", () => {
    favoriteOnly = !favoriteOnly;

    favoriteOnlyBtn.textContent = favoriteOnly
      ? "♡ 全投稿を表示"
      : "♡ お気に入りだけ表示";

    favoriteOnlyBtn.classList.toggle("active", favoriteOnly);

    renderOutfits(searchInput ? searchInput.value : "");
  });
}

function renderTags() {
  const tagList = document.getElementById("tagList");
  if (!tagList) return;

  tagList.innerHTML = "";

  tags.forEach((tag, index) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = `#${tag}`;

    span.onclick = () => {
      tags.splice(index, 1);
      renderTags();
    };

    tagList.appendChild(span);
  });
}

function addItem() {
  const nameInput = document.getElementById("itemName");
  const codeInput = document.getElementById("itemCode");

  const name = nameInput.value.trim();
  const code = codeInput.value.trim();

  if (!name || !code) {
    alert("商品名とSHEIN商品コードを入れてください");
    return;
  }

  items.push({ name, code });

  nameInput.value = "";
  codeInput.value = "";

  renderItems();
}

function renderItems() {
  const itemList = document.getElementById("itemList");
  if (!itemList) return;

  itemList.innerHTML = "";

  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item-chip";

    div.innerHTML = `
      ${item.name} / 商品コード：${item.code}
      <button type="button" class="small-btn" onclick="removeItem(${index})">削除</button>
    `;

    itemList.appendChild(div);
  });
}

function removeItem(index) {
  items.splice(index, 1);
  renderItems();
}

function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

const maxWidth = 350;

        const scale =
          img.width > maxWidth
            ? maxWidth / img.width
            : 1;

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedImage = canvas.toDataURL("image/jpeg", 0.35);

        resolve(compressedImage);
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

function readImageFiles(files) {
  const fileArray = Array.from(files).slice(0, 1);

  return Promise.all(
    fileArray.map(file => compressImage(file))
  );
}

async function addOutfit() {
  const titleInput = document.getElementById("title");
  const imageInput = document.getElementById("image");
  const heightInput = document.getElementById("height");

  const title = titleInput.value.trim();
  const height = heightInput.value.trim();

  if (!title || imageInput.files.length === 0 || !height || items.length === 0) {
    alert("コーデ名・画像・身長・アイテムを入れてください");
    return;
  }

  const images = await readImageFiles(imageInput.files);

  const outfit = {
    id: Date.now(),
    title,
    image: images[0],
    images,
    height,
    tags: [...tags],
    items: [...items],
    date: new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }),
    createdAt: Date.now()
  };

  try {
    await addDoc(collection(db, "outfits"), outfit);
  } catch (error) {
    alert("Firebaseへの保存に失敗しました。画像が大きすぎるか、Firestoreの設定を確認してください。");
    console.error(error);
    return;
  }

  titleInput.value = "";
  imageInput.value = "";
  heightInput.value = "";

  tags = [];
  items = [];

  renderTags();
  renderItems();

  alert("投稿できました！");
  location.href = "posts.html";
}

function renderPopularTags() {
  if (!popularTags) return;

  popularTags.innerHTML = "";

  const tagCount = {};

  outfits.forEach(outfit => {
    if (!outfit.tags) return;

    outfit.tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);

  if (sortedTags.length === 0) {
    popularTags.innerHTML = `<p class="empty">まだタグがありません。</p>`;
    return;
  }

  sortedTags.forEach(([tag, count]) => {
    const button = document.createElement("button");
    button.className = "popular-tag";
    button.textContent = `#${tag} (${count})`;

    button.addEventListener("click", () => {
      if (searchInput) searchInput.value = tag;
      renderOutfits(tag);
    });

    popularTags.appendChild(button);
  });
}

function toggleFavorite(id) {
  if (favoriteOutfits.includes(id)) {
    favoriteOutfits = favoriteOutfits.filter(item => item !== id);
  } else {
    favoriteOutfits.push(id);
  }

  localStorage.setItem("favoriteOutfits", JSON.stringify(favoriteOutfits));
  renderOutfits(searchInput ? searchInput.value : "");
}

function renderOutfits(keyword = "") {
  if (!outfitList) return;

  outfitList.innerHTML = "";

  const searchWord = keyword.trim().toLowerCase();

  const filteredOutfits = outfits.filter(outfit => {
    const titleText = outfit.title.toLowerCase();
    const heightText = outfit.height.toLowerCase();
    const tagText = outfit.tags.join(" ").toLowerCase();
    const itemText = outfit.items.map(item => `${item.name} ${item.code}`).join(" ").toLowerCase();

    const allText = `${titleText} ${heightText} ${tagText} ${itemText}`;
    const matchesSearch = allText.includes(searchWord);

    if (favoriteOnly) {
      return matchesSearch && favoriteOutfits.includes(outfit.id);
    }

    return matchesSearch;
  });

  if (outfits.length === 0) {
    outfitList.innerHTML = `<p class="empty">まだ投稿がありません。</p>`;
    return;
  }

  if (filteredOutfits.length === 0) {
    outfitList.innerHTML = `<p class="empty">検索に合う投稿がありません。</p>`;
    return;
  }

  filteredOutfits.forEach((outfit) => {
    const card = document.createElement("article");
    card.className = "post-card";

    const tagHtml = outfit.tags && outfit.tags.length
      ? outfit.tags.map(tag =>
          `<span class="tag" onclick="event.stopPropagation(); searchByTag('${tag}')">#${tag}</span>`
        ).join("")
      : "";

  <img src="${getMainImage(outfit)}" alt="${outfit.title}">

  <div class="card-body">

    <div class="card-title-row">

      <h3>${outfit.title}</h3>

      <button
        class="favorite-btn mini ${favoriteOutfits.includes(outfit.id) ? 'active' : ''}"
        onclick="event.stopPropagation(); toggleFavorite(${outfit.id})"
      >
        ${favoriteOutfits.includes(outfit.id) ? '♥' : '♡'}
      </button>

    </div>

    <p class="card-height">
      ${outfit.height}
    </p>

    <div class="card-tags">
      ${tagHtml}
    </div>

    <p class="card-info">
      画像 ${outfit.images ? outfit.images.length : 1}枚 ／ アイテム ${outfit.items.length}点
    </p>

    <button
      class="small-btn full-btn"
      onclick="event.stopPropagation(); location.href='outfit.html?id=${outfit.id}'"
    >
      詳しく見る
    </button>

  </div>

    card.addEventListener("click", () => {
      location.href = `outfit.html?id=${outfit.id}`;
    });

    outfitList.appendChild(card);
  });
}

function searchByTag(tag) {
  if (!searchInput) return;

  searchInput.value = tag;
  renderOutfits(tag);
}


function addTag() {
  const tagInput = document.getElementById("tagInput");
  if (!tagInput) return;

  const tag = tagInput.value.trim();

  if (tag && !tags.includes(tag)) {
    tags.push(tag);
    tagInput.value = "";
    renderTags();
  }
}

window.addTag = addTag;
window.addItem = addItem;
window.removeItem = removeItem;
window.addOutfit = addOutfit;
window.toggleFavorite = toggleFavorite;
window.searchByTag = searchByTag;

document.addEventListener("DOMContentLoaded", () => {
  const tagAddBtn = document.getElementById("tagAddBtn");
  const itemAddBtn = document.getElementById("itemAddBtn");
  const outfitAddBtn = document.getElementById("outfitAddBtn");

  if (tagAddBtn) {
    tagAddBtn.addEventListener("click", addTag);
  }

  if (itemAddBtn) {
    itemAddBtn.addEventListener("click", addItem);
  }

  if (outfitAddBtn) {
    outfitAddBtn.addEventListener("click", addOutfit);
  }

  if (outfitList || popularTags) {
    loadOutfits();
  }
});