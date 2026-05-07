import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const outfitId = Number(params.get("id"));
const editArea = document.getElementById("editArea");

let outfits = [];
let outfit = null;
let editTags = [];
let editItems = [];

async function loadEditOutfit() {
  const q = query(
    collection(db, "outfits"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  outfits = snapshot.docs.map(docItem => ({
    firebaseId: docItem.id,
    ...docItem.data()
  }));

  outfit = outfits.find(item => item.id === outfitId);

  if (!outfit) {
    editArea.innerHTML = `
      <p class="empty">編集する投稿が見つかりませんでした。</p>
      <a class="back-link" href="posts.html">投稿一覧に戻る</a>
    `;
    return;
  }

  editTags = [...outfit.tags];
  editItems = [...outfit.items];

  renderEditForm();
}

function getMainImage(outfit) {
  if (outfit.images && outfit.images.length > 0) {
    return outfit.images[0];
  }

  return outfit.image;
}

function renderEditForm() {
  editArea.innerHTML = `
    <div class="form-section">
      <h2>基本情報</h2>

      <input
        id="editTitle"
        placeholder="コーデ名"
        value="${outfit.title}"
      >

      <input
        id="editHeight"
        placeholder="身長 例：152cm"
        value="${outfit.height}"
      >

      <p class="help">画像の変更は次の段階で追加します。</p>

      <img
        class="edit-preview-image"
        src="${getMainImage(outfit)}"
        alt="${outfit.title}"
      >
    </div>

    <div class="form-section">
      <h2>タグ</h2>
      <p class="help">タグを入力してEnter。タグを押すと削除できます。</p>
      <input id="editTagInput" placeholder="例：韓国、低身長、春コーデ">
      <div id="editTagList"></div>
    </div>

    <div class="form-section">
      <h2>着用アイテム</h2>

      <input id="editItemName" placeholder="商品名 例：トップス">
      <input id="editItemCode" placeholder="SHEIN商品コード 例：414417747">

      <button type="button" class="dark-btn" onclick="addEditItem()">
        ＋ アイテム追加
      </button>

      <div id="editItemList"></div>
    </div>

    <button class="main-btn full-btn" onclick="saveEdit()">
      編集を保存する
    </button>
  `;

  document.getElementById("editTagInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();

      const tag = this.value.trim();

      if (tag && !editTags.includes(tag)) {
        editTags.push(tag);
        this.value = "";
        renderEditTags();
      }
    }
  });

  renderEditTags();
  renderEditItems();
}

function renderEditTags() {
  const editTagList = document.getElementById("editTagList");
  editTagList.innerHTML = "";

  editTags.forEach((tag, index) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = `#${tag}`;

    span.onclick = () => {
      editTags.splice(index, 1);
      renderEditTags();
    };

    editTagList.appendChild(span);
  });
}

function addEditItem() {
  const nameInput = document.getElementById("editItemName");
  const codeInput = document.getElementById("editItemCode");

  const name = nameInput.value.trim();
  const code = codeInput.value.trim();

  if (!name || !code) {
    alert("商品名とSHEIN商品コードを入れてください");
    return;
  }

  editItems.push({ name, code });

  nameInput.value = "";
  codeInput.value = "";

  renderEditItems();
}

function renderEditItems() {
  const editItemList = document.getElementById("editItemList");
  editItemList.innerHTML = "";

  editItems.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "edit-item-box";

    div.innerHTML = `
      <input
        value="${item.name}"
        placeholder="商品名"
        oninput="updateEditItemName(${index}, this.value)"
      >

      <input
        value="${item.code}"
        placeholder="商品コード"
        oninput="updateEditItemCode(${index}, this.value)"
      >

      <button
        type="button"
        class="delete-btn"
        onclick="removeEditItem(${index})"
      >
        削除
      </button>
    `;

    editItemList.appendChild(div);
  });
}

function updateEditItemName(index, value) {
  editItems[index].name = value;
}

function updateEditItemCode(index, value) {
  editItems[index].code = value;
}

function removeEditItem(index) {
  editItems.splice(index, 1);
  renderEditItems();
}

async function saveEdit() {
  const title = document.getElementById("editTitle").value.trim();
  const height = document.getElementById("editHeight").value.trim();

  if (!title || !height || editItems.length === 0) {
    alert("コーデ名・身長・アイテムを入れてください");
    return;
  }

  try {
    await updateDoc(doc(db, "outfits", outfit.firebaseId), {
      title,
      height,
      tags: [...editTags],
      items: [...editItems]
    });

    alert("編集を保存しました！");
    location.href = `outfit.html?id=${outfitId}`;
  } catch (error) {
    console.error(error);
    alert("編集の保存に失敗しました");
  }
}

window.addEditItem = addEditItem;
window.updateEditItemName = updateEditItemName;
window.updateEditItemCode = updateEditItemCode;
window.removeEditItem = removeEditItem;
window.saveEdit = saveEdit;

loadEditOutfit();