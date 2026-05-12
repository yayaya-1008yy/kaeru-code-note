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

const style = document.createElement("style");
style.textContent = `
  .mypage-profile-top {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 20px;
  }

  .mypage-profile-icon {
    width: 96px;
    height: 96px;
    border-radius: 999px;
    object-fit: cover;
    display: block;
    border: 3px solid #e8f7fc;
    background: #f4fbff;
    box-shadow: 0 12px 30px rgba(100,160,180,0.16);
  }

  @media (max-width: 700px) {
    .mypage-profile-top {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;
document.head.appendChild(style);

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
  if (outfit.images && outfit.images.length > 0) return outfit.images[0];
  if (outfit.image) return outfit.image;
  if (outfit.imageUrl) return outfit.imageUrl;

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
            プロフィール編集から設定できます。
          </p>
        </div>
      `;
      return;
    }

    const profile = profileSnap.data();

    profileSummary.innerHTML = `
      <div class="form-box" style="margin-bottom:20px;">

        <div class="mypage-profile-top">
          <img
            class="mypage-profile-icon"
            src="${profile.iconUrl || profile.photoURL || "default-icon.png"}"
            alt="プロフィールアイコン"
          >

          <div>
            <p style="
              color:#8fd7ea;
              font-size:12px;
              font-weight:900;
              letter-spacing:2px;
              margin-bottom:10px;
            ">
              PROFILE
            </p>

            <h2 style="margin:0 0 12px; font-size:34px;">
              ${profile.displayName || "NO NAME"}
            </h2>
          </div>
        </div>

        <p style="color:#666; line-height:1.8; margin-bottom:24px;">
          ${profile.bio || "自己紹介はまだありません。"}
        </p>

        <div class="profile-info-list">
          ${profile.height ? `
            <div class="profile-info-item">
              <span>身長</span>
              <strong>${profile.height}</strong>
            </div>
          ` : ""}

          ${profile.bodyType ? `
            <div class="profile-info-item">
              <span>体型・サイズ感</span>
              <strong>${profile.bodyType}</strong>
            </div>
          ` : ""}

          ${profile.usualSize ? `
            <div class="profile-info-item">
              <span>よく買うサイズ</span>
              <strong>${profile.usualSize}</strong>
            </div>
          ` : ""}

          ${profile.favoriteStyle ? `
            <div class="profile-info-item">
              <span>好きな系統</span>
              <strong>${profile.favoriteStyle}</strong>
            </div>
          ` : ""}

          ${profile.favoriteColor ? `
            <div class="profile-info-item">
              <span>好きな色</span>
              <strong>${profile.favoriteColor}</strong>
            </div>
          ` : ""}
        </div>

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
  outfitList.innerHTML = `<p class="empty">読み込み中...</p>`;

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
          ? outfit.tags.map(tag => `<span class="tag">#${tag}</span>`).join("")
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