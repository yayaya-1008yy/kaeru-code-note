import {
  db,
  auth
} from "./firebase.js";

import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let tags = [];
let items = [];
let currentUser = null;

const authBox = document.getElementById("authBox");
const uploadForm = document.getElementById("uploadForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const tagInput = document.getElementById("tagInput");
const tagAddBtn = document.getElementById("tagAddBtn");
const tagList = document.getElementById("tagList");

const itemName = document.getElementById("itemName");
const itemCode = document.getElementById("itemCode");
const itemAddBtn = document.getElementById("itemAddBtn");
const itemList = document.getElementById("itemList");

const imageInputs = document.querySelectorAll(".imageInput");
const outfitAddBtn = document.getElementById("outfitAddBtn");

async function register() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("メールアドレスとパスワードを入れてください");
    return;
  }

  try {
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("登録できました！");
  } catch (error) {
    console.error(error);
    alert("登録に失敗しました");
  }
}

async function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("メールアドレスとパスワードを入れてください");
    return;
  }

  try {
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("ログインしました！");
  } catch (error) {
    console.error(error);
    alert("ログインに失敗しました");
  }
}

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
        let maxWidth = 500;
        let quality = 0.45;
        let result = "";

        while (true) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const scale =
            img.width > maxWidth
              ? maxWidth / img.width
              : 1;

          canvas.width =
            Math.floor(img.width * scale);

          canvas.height =
            Math.floor(img.height * scale);

          ctx.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
          );

          result =
            canvas.toDataURL("image/jpeg", quality);

          if (
            result.length < 90000 ||
            maxWidth <= 350 ||
            quality <= 0.35
          ) {
            break;
          }

          maxWidth -= 100;
          quality -= 0.08;
        }

        resolve(result);
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

async function getSelectedImages() {
  const images = [];

  for (const input of imageInputs) {
    if (input.files && input.files[0]) {
      const image =
        await compressImage(input.files[0]);

      images.push(image);
    }
  }

  return images;
}

async function addOutfit() {
  if (!currentUser) {
    alert("ログインしてください");
    return;
  }

  const titleInput =
    document.getElementById("title");

  const heightInput =
    document.getElementById("height");

  const title =
    titleInput.value.trim();

  const height =
    heightInput.value.trim();

  const images =
    await getSelectedImages();

  if (
    !title ||
    images.length === 0 ||
    !height ||
    items.length === 0
  ) {
    alert("コーデ名・画像・身長・アイテムを入れてください");
    return;
  }

  const outfit = {
    id: Date.now(),
    title,
    image: images[0],
    images,
    height,
    tags: [...tags],
    items: [...items],
    date: new Date().toLocaleDateString("ja-JP"),
    createdAt: Date.now(),
    userId: currentUser.uid,
    userEmail: currentUser.email,
    favoriteCount: 0,
    viewCount: 0
  };

  await addDoc(
    collection(db, "outfits"),
    outfit
  );

  alert("投稿できました！");
  location.href = "posts.html";
}

onAuthStateChanged(auth, user => {
  currentUser = user;

  if (user) {
    authBox.style.display = "none";
    uploadForm.style.display = "block";
  } else {
    authBox.style.display = "block";
    uploadForm.style.display = "none";
  }
});

registerBtn.addEventListener("click", register);
loginBtn.addEventListener("click", login);

tagAddBtn.addEventListener("click", addTag);

tagInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    addTag();
  }
});

itemAddBtn.addEventListener("click", addItem);
outfitAddBtn.addEventListener("click", addOutfit);