import {
  db,
  auth
} from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const authBox = document.getElementById("authBox");
const myPageArea = document.getElementById("myPageArea");
const outfitList = document.getElementById("outfitList");
const profileSummary = document.getElementById("profileSummary");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginUserEmail = document.getElementById("loginUserEmail");

async function register() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("メールアドレスとパスワードを入れてください");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
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
    await signInWithEmailAndPassword(auth, email, password);
    alert("ログインしました！");
  } catch (error) {
    console.error(error);
    alert("ログインに失敗しました");
  }
}

async function logout() {
  try {
    await signOut(auth);
    alert("ログアウトしました");
  } catch (error) {
    console.error(error);
    alert("ログアウトに失敗しました");
  }
}

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

async function loadProfile(user) {
  if (!profileSummary) return;

  profileSummary.innerHTML = `
    <div class="form-box" style="margin-bottom:20px;">
      <p class="empty">プロフィール読み込み中...</p>
    </div>
  `;

  try {
    const profileRef = doc(db, "profiles", user.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      profileSummary.innerHTML = `
        <div class="form-box" style="margin-bottom:20px;">
          <h2 style="margin-top:0;">プロフィール未設定</h2>
          <p style="color:#666; line-height:1.7;">
            プロフィール編集から、表示名と自己紹介を設定できます。
          </p>
        </div>
      `;
      return;
    }

    const profile = profileSnap.data();

    profileSummary.innerHTML = `
      <div class="form-box" style="margin-bottom:20px;">
        <h2 style="margin-top:0;">
          ${profile.displayName || "NO NAME"}
        </h2>

        <p style="color:#666; line-height:1.7;">
          ${profile.bio || "自己紹介はまだありません。"}
        </p>
      </div>
    `;

  } catch (error) {
    console.error(error);

    profileSummary.innerHTML = `
      <div class="form-box" style="margin-bottom:20px;">
        <p class="empty">プロフィールを読み込めませんでした。</p>
      </div>
    `;
  }
}

async function loadMyOutfits(user) {
  outfitList.innerHTML =
    `<p class="empty">読み込み中...</p>`;

  try {
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

          <p class="card-height">
            ${outfit.height || ""}
          </p>

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

  } catch (error) {
    console.error(error);

    outfitList.innerHTML =
      `<p class="empty">自分の投稿を読み込めませんでした。</p>`;
  }
}

onAuthStateChanged(auth, user => {
  if (user) {
    authBox.style.display = "none";
    myPageArea.style.display = "block";

    if (loginUserEmail) {
      loginUserEmail.textContent = user.email;
    }

    loadProfile(user);
    loadMyOutfits(user);

  } else {
    authBox.style.display = "block";
    myPageArea.style.display = "none";

    if (loginUserEmail) {
      loginUserEmail.textContent = "";
    }
  }
});

registerBtn.addEventListener("click", register);
loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);