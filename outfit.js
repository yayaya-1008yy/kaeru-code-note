import {
  db,
  auth
} from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let outfits = [];
let currentUser = null;

let favoriteOutfits =
  JSON.parse(localStorage.getItem("favoriteOutfits")) || [];

const params =
  new URLSearchParams(window.location.search);

const outfitId =
  Number(params.get("id"));

const detailArea =
  document.getElementById("detailArea");

let currentImageIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

function getImages(outfit) {
  if (outfit.images && outfit.images.length > 0) {
    return outfit.images;
  }

  if (outfit.image) {
    return [outfit.image];
  }

  if (outfit.imageUrl) {
    return [outfit.imageUrl];
  }

  return ["https://placehold.co/600x800?text=NO+IMAGE"];
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

function reportOutfit(title) {
  const reason =
    prompt(
      `「${title}」を通報します。\n理由を入力してください。`
    );

  if (!reason) return;

  alert(
    "通報を受け付けました。\nご協力ありがとうございます。"
  );

  console.log("通報内容:", {
    title,
    reason
  });
}

function swipeImage(direction) {
  const outfit =
    outfits.find(item => item.id === outfitId);

  if (!outfit) return;

  const images =
    getImages(outfit);

  if (images.length <= 1) return;

  if (direction === "next") {
    currentImageIndex =
      currentImageIndex < images.length - 1
        ? currentImageIndex + 1
        : 0;
  }

  if (direction === "prev") {
    currentImageIndex =
      currentImageIndex > 0
        ? currentImageIndex - 1
        : images.length - 1;
  }

  renderDetail();
}

async function deleteOutfit(firebaseId) {
  if (!confirm("この投稿を削除しますか？")) return;

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

  const snapshot =
    await getDocs(q);

  outfits =
    snapshot.docs.map(docItem => ({
      firebaseId: docItem.id,
      ...docItem.data()
    }));

  renderDetail();
}

async function loadProfileMini(outfit) {
  const profileArea =
    document.getElementById("profileMiniCard");

  if (!profileArea) return;

  const userId =
    outfit.ownerId || outfit.userId;

  if (!userId) {
    profileArea.innerHTML = "";
    return;
  }

  try {
    const profileRef =
      doc(db, "profiles", userId);

    const profileSnap =
      await getDoc(profileRef);

    if (!profileSnap.exists()) {
      profileArea.innerHTML = "";
      return;
    }

    const profile =
      profileSnap.data();

    profileArea.innerHTML = `
      <div class="profile-mini-card">

        <p class="profile-mini-label">
          POSTED BY
        </p>

        <h2>
          ${profile.displayName || "NO NAME"}
        </h2>

        <p class="profile-mini-bio">
          ${profile.bio || ""}
        </p>

        <div class="profile-mini-info">

          ${profile.height ? `
            <div>
              <span>身長</span>
              <strong>${profile.height}</strong>
            </div>
          ` : ""}

          ${profile.bodyType ? `
            <div>
              <span>体型・サイズ感</span>
              <strong>${profile.bodyType}</strong>
            </div>
          ` : ""}

          ${profile.usualSize ? `
            <div>
              <span>よく買うサイズ</span>
              <strong>${profile.usualSize}</strong>
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

        </div>

      </div>
    `;

  } catch (error) {
    console.error(error);
    profileArea.innerHTML = "";
  }
}

function renderDetail() {
  const outfit =
    outfits.find(item => item.id === outfitId);

  if (!outfit) {
    detailArea.innerHTML = `
      <p class="empty">
        この投稿は見つかりませんでした。
      </p>

      <a
        class="back-link"
        href="posts.html"
      >
        投稿一覧に戻る
      </a>
    `;

    return;
  }

  if (!outfit.viewed) {
    outfit.viewed = true;

    const outfitRef =
      doc(db, "outfits", outfit.firebaseId);

    updateDoc(outfitRef, {
      viewCount: increment(1)
    });

    outfit.viewCount =
      (outfit.viewCount || 0) + 1;
  }

  const images =
    getImages(outfit);

  if (currentImageIndex >= images.length) {
    currentImageIndex = 0;
  }

  const thumbnailHtml =
    images.map((image, index) => `
      <img
        class="thumbnail-image ${index === currentImageIndex ? 'active' : ''}"
        src="${image}"
        alt="サブ画像${index + 1}"
        onclick="changeMainImage(${index})"
      >
    `).join("");

  const tagHtml =
    outfit.tags && outfit.tags.length
      ? outfit.tags.map(tag =>
          `<span class="tag">#${tag}</span>`
        ).join("")
      : `<span class="tag">タグなし</span>`;

  const itemHtml =
    outfit.items && outfit.items.length
      ? outfit.items.map((item, index) => `
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
      `).join("")
      : `<p class="empty">アイテム情報がありません。</p>`;

  const isOwner =
    currentUser &&
    (
      currentUser.uid === outfit.userId ||
      currentUser.uid === outfit.ownerId
    );

  detailArea.innerHTML = `
    <div class="detail-image-wrap">
      <img
        class="detail-image"
        src="${images[currentImageIndex]}"
        alt="${outfit.title || "コーデ画像"}"
        id="swipeImage"
      >
    </div>

    <div class="thumbnail-list">
      ${thumbnailHtml}
    </div>

    <div class="detail-title-row">

      <h1 class="detail-title">
        ${outfit.title || "無題のコーデ"}
      </h1>

      <button
        class="favorite-btn detail-favorite-btn ${isFavorite(outfit.id) ? 'active' : ''}"
        onclick="toggleFavorite(${outfit.id})"
      >
        ${isFavorite(outfit.id)
          ? '♥ 保存済み'
          : '♡ お気に入り'}
      </button>

      ${isOwner ? `
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
      ` : ""}

    </div>

<div class="post-user-link">
  <a href="user.html?uid=${outfit.userId || outfit.ownerId}">
    ${outfit.userName || "ユーザーページを見る"}
  </a>
</div>

    <p class="post-date">
      投稿日：${outfit.date || "投稿日なし"}
    </p>

    <p class="card-info">
      👀 ${outfit.viewCount || 0}
      ／ ♥ ${outfit.favoriteCount || 0}
    </p>

    <button
      class="delete-btn"
      onclick="reportOutfit('${outfit.title || "無題のコーデ"}')"
    >
      通報する
    </button>

    <div class="detail-tags">
      ${tagHtml}
    </div>

    <div class="detail-items">
      <h2>着用アイテム</h2>
      ${itemHtml}
    </div>
  `;

  loadProfileMini(outfit);

  const swipeTarget =
    document.getElementById("swipeImage");

  if (swipeTarget) {
    swipeTarget.addEventListener("touchstart", e => {
      touchStartX =
        e.changedTouches[0].screenX;
    });

    swipeTarget.addEventListener("touchend", e => {
      touchEndX =
        e.changedTouches[0].screenX;

      if (touchStartX - touchEndX > 50) {
        swipeImage("next");
      }

      if (touchEndX - touchStartX > 50) {
        swipeImage("prev");
      }
    });
  }
}

window.toggleFavorite =
  toggleFavorite;

window.changeMainImage =
  changeMainImage;

window.deleteOutfit =
  deleteOutfit;

window.copyCode =
  copyCode;

window.reportOutfit =
  reportOutfit;

onAuthStateChanged(auth, user => {
  currentUser = user;
  loadOutfit();
});

const imageModal =
  document.getElementById("imageModal");

const modalImage =
  document.getElementById("modalImage");

const modalClose =
  document.getElementById("modalClose");

let modalImageIndex = 0;
let modalTouchStartX = 0;
let modalTouchEndX = 0;

function openImageModal(index) {
  const outfit =
    outfits.find(item => item.id === outfitId);

  if (!outfit) return;

  const images =
    getImages(outfit);

  modalImageIndex = index;

  modalImage.src =
    images[modalImageIndex];

  imageModal.classList.add("active");
}

function changeModalImage(direction) {
  const outfit =
    outfits.find(item => item.id === outfitId);

  if (!outfit) return;

  const images =
    getImages(outfit);

  if (images.length <= 1) return;

  if (direction === "next") {
    modalImageIndex =
      modalImageIndex < images.length - 1
        ? modalImageIndex + 1
        : 0;
  }

  if (direction === "prev") {
    modalImageIndex =
      modalImageIndex > 0
        ? modalImageIndex - 1
        : images.length - 1;
  }

  modalImage.src =
    images[modalImageIndex];
}

document.addEventListener("click", (e) => {
  const mainImage =
    e.target.closest(".detail-image");

  const thumbnailImage =
    e.target.closest(".thumbnail-image");

  if (!mainImage && !thumbnailImage) return;

  e.stopPropagation();

  if (mainImage) {
    openImageModal(currentImageIndex);
  }

  if (thumbnailImage) {
    const thumbnails =
      Array.from(
        document.querySelectorAll(".thumbnail-image")
      );

    const index =
      thumbnails.indexOf(thumbnailImage);

    openImageModal(index);
  }
});

modalImage.addEventListener("touchstart", e => {
  modalTouchStartX =
    e.changedTouches[0].screenX;
});

modalImage.addEventListener("touchend", e => {
  modalTouchEndX =
    e.changedTouches[0].screenX;

  if (modalTouchStartX - modalTouchEndX > 50) {
    changeModalImage("next");
  }

  if (modalTouchEndX - modalTouchStartX > 50) {
    changeModalImage("prev");
  }
});

modalClose.addEventListener("click", () => {
  imageModal.classList.remove("active");
});

imageModal.addEventListener("click", (e) => {
  if (e.target === imageModal) {
    imageModal.classList.remove("active");
  }
});

const modalPrev =
  document.getElementById("modalPrev");

const modalNext =
  document.getElementById("modalNext");

modalPrev.addEventListener("click", (e) => {
  e.stopPropagation();
  changeModalImage("prev");
});

modalNext.addEventListener("click", (e) => {
  e.stopPropagation();
  changeModalImage("next");
});