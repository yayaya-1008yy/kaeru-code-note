alert("upload.js 読めてる");

import { db } from "./firebase.js";

import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let tags = [];
let items = [];

const tagInput = document.getElementById("tagInput");
const tagAddBtn = document.getElementById("tagAddBtn");
const tagList = document.getElementById("tagList");

const itemName = document.getElementById("itemName");
const itemCode = document.getElementById("itemCode");
const itemAddBtn = document.getElementById("itemAddBtn");
const itemList = document.getElementById("itemList");

const outfitAddBtn = document.getElementById("outfitAddBtn");

function renderTags() {
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

function addTag() {
  const tag = tagInput.value.trim();

  if (!tag) {
    alert("タグを入力してね");
    return;
  }

  if (!tags.includes(tag)) {
    tags.push(tag);
  }

  tagInput.value = "";
  renderTags();
}

function renderItems() {
  itemList.innerHTML = "";

  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item-chip";

    div.innerHTML = `
      ${item.name} / 商品コード：${item.code}
      <button type="button" class="small-btn">削除</button>
    `;

    div.querySelector("button").onclick = () => {
      items.splice(index, 1);
      renderItems();
    };

    itemList.appendChild(div);
  });
}

function addItem() {
  const name = itemName.value.trim();
  const code = itemCode.value.trim();

  if (!name || !code) {
    alert("商品名とSHEIN商品コードを入れてね");
    return;
  }

  items.push({ name, code });

  itemName.value = "";
  itemCode.value = "";

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
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.35));
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
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

  const image = await compressImage(imageInput.files[0]);

  const outfit = {
    id: Date.now(),
    title,
    image,
    images: [image],
    height,
    tags: [...tags],
    items: [...items],
    date: new Date().toLocaleDateString("ja-JP"),
    createdAt: Date.now()
  };

  await addDoc(collection(db, "outfits"), outfit);

  alert("投稿できました！");
  location.href = "posts.html";
}

tagAddBtn.addEventListener("click", addTag);

tagInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    addTag();
  }
});

itemAddBtn.addEventListener("click", addItem);
outfitAddBtn.addEventListener("click", addOutfit);