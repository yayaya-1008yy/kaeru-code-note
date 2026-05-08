import {
  db,
  auth
} from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const outfitList = document.getElementById("outfitList");

function showLoginBox() {
  outfitList.innerHTML = `
    <div class="auth-box">
      <h2>ログインが必要です</h2>
      <p>マイページを見るにはログインしてください。</p>

      <input id="myEmail" type="email" placeholder="メールアドレス">
      <input id="myPassword" type="password" placeholder="パスワード">

      <button class="main-btn" id="myLoginBtn">
        ログイン
      </button>

      <button class="sub-btn" id="myRegisterBtn">
        新規登録
      </button>
    </div>
  `;

  document.getElementById("myLoginBtn").onclick = login;
  document.getElementById("myRegisterBtn").onclick = register;
}

async function login() {
  const email = document.getElementById("myEmail").value.trim();
  const password = document.getElementById("myPassword").value.trim();

  if (!email || !password) {
    alert("メールアドレスとパスワードを入れてください");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("ログインしました");
  } catch (error) {
    console.error(error);
    alert("ログインに失敗しました");
  }
}

async function register() {
  const email = document.getElementById("myEmail").value.trim();
  const password = document.getElementById("myPassword").value.trim();

  if (!email || !password) {
    alert("メールアドレスとパスワードを入れてください");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("登録できました");
  } catch (error) {
    console.error(error);
    alert("登録に失敗しました");
  }
}

function getMainImage(outfit) {
  if (outfit.images && outfit.images.length > 0) {
    return outfit.images[0];
  }

  if (outfit.image) {
    return outfit.image;
  }

  return "https://placehold.co/600x800?text=NO+IMAGE";
}

async function loadMyOutfits(user) {
  outfitList.innerHTML =
    `<p class="empty">読み込み中...</p>`;

  const q = query(
    collection(db, "outfits"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  const myOutfits = snapshot.docs
    .map(docItem => ({
      firebaseId: docItem.id,
      ...docItem.data()
    }))
    .filter(outfit =>
      outfit.ownerId === user.uid ||
      outfit.userId === user.uid
    );

  if (myOutfits.length === 0) {
    outfitList.innerHTML =
      `<p class="empty">まだ自分の投稿がありません。</p>`;
    return;
  }

  outfitList.innerHTML = "";

  myOutfits.forEach(outfit => {
    const card = document.createElement("article");
    card.className = "post-card";

    card.innerHTML = `
      <div class="card-image-wrap">
        <img
          src="${getMainImage(outfit)}"
          alt="${outfit.title || "コーデ画像"}"
        >
      </div>

      <div class="card-body">
        <h3>${outfit.title || "無題のコーデ"}</h3>

        <p class="card-height">
          ${outfit.height || ""}
        </p>

        <button
          class="small-btn full-btn"
          onclick="location.href='outfit.html?id=${outfit.id}'"
        >
          詳しく見る
        </button>

        <button
          class="small-btn full-btn"
          onclick="location.href='edit.html?id=${outfit.id}'"
        >
          編集する
        </button>
      </div>
    `;

    outfitList.appendChild(card);
  });
}

onAuthStateChanged(auth, user => {
  if (!user) {
    showLoginBox();
    return;
  }

  loadMyOutfits(user);
});