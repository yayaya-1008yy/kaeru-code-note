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
  getDoc,
  where,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
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

const deletePassword = document.getElementById("deletePassword");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

const style = document.createElement("style");
style.textContent = `
  .mypage-profile-top {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 20px;
  }

  .mypage-profile-icon,
  .mypage-profile-icon-fallback {
    width: 96px;
    height: 96px;
    border-radius: 999px;
    object-fit: cover;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #e8f7fc;
    background: #f4fbff;
    box-shadow: 0 12px 30px rgba(100,160,180,0.16);
    font-size: 38px;
    font-weight: 900;
    color: #65c5df;
    flex-shrink: 0;
  }

  .mypage-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 0 0 24px;
  }

  .mypage-stats > div {
    background: #f8fafb;
    border: 1px solid #e7ecef;
    border-radius: 18px;
    padding: 14px 10px;
    text-align: center;
  }

  .mypage-stats strong {
    display: block;
    font-size: 22px;
    color: #111;
    font-weight: 900;
    line-height: 1.1;
  }

  .mypage-stats span {
    display: block;
    margin-top: 6px;
    font-size: 11px;
    color: #777;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .mypage-stats .stat-clickable {
    cursor: pointer;
    transition: 0.2s;
  }

  .mypage-stats .stat-clickable:hover {
    transform: translateY(-2px);
    opacity: 0.75;
  }

  @media (max-width: 700px) {
    .mypage-profile-top {
      flex-direction: column;
      align-items: flex-start;
    }

    .mypage-stats {
      gap: 8px;
    }

    .mypage-stats > div {
      padding: 12px 4px;
    }

    .mypage-stats strong {
      font-size: 18px;
    }

    .mypage-stats span {
      font-size: 10px;
      white-space: nowrap;
    }
  }
`;
document.head.appendChild(style);

function getProfileIcon(profile) {
  return profile.iconImage || "";
}

async function getFollowCounts(user) {
  const followersQuery = query(
    collection(db, "follows"),
    where("followingId", "==", user.uid)
  );

  const followingQuery = query(
    collection(db, "follows"),
    where("followerId", "==", user.uid)
  );

  const followersSnap = await getDocs(followersQuery);
  const followingSnap = await getDocs(followingQuery);

  return {
    followers: followersSnap.size,
    following: followingSnap.size
  };
}

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

async function loadProfile(user, postCount = 0) {
  if (!profileSummary) return;

  profileSummary.innerHTML = `
    <div class="form-box" style="margin-bottom:20px;">
      <p class="empty">プロフィール読み込み中...</p>
    </div>
  `;

  try {
    const profileRef = doc(db, "profiles", user.uid);
    const profileSnap = await getDoc(profileRef);
    const followCounts = await getFollowCounts(user);

    if (!profileSnap.exists()) {
      profileSummary.innerHTML = `
        <div class="form-box" style="margin-bottom:20px;">
          <h2 style="margin-top:0;">プロフィール未設定</h2>

          <div class="mypage-stats">
            <div>
              <strong>${postCount}</strong>
              <span>POSTS</span>
            </div>

            <div
              class="stat-clickable"
              onclick="location.href='following.html?uid=${user.uid}'"
            >
              <strong>${followCounts.following}</strong>
              <span>FOLLOW</span>
            </div>

            <div>
              <strong>${followCounts.followers}</strong>
              <span>FOLLOWERS</span>
            </div>
          </div>

          <p style="color:#666; line-height:1.7;">
            プロフィール編集から設定できます。
          </p>
        </div>
      `;
      return;
    }

    const profile = profileSnap.data();
    const iconSrc = getProfileIcon(profile);

    const iconHtml = iconSrc
      ? `
        <img
          class="mypage-profile-icon"
          src="${iconSrc}"
          alt=""
          onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '<div class=&quot;mypage-profile-icon-fallback&quot;>☻</div>');"
        >
      `
      : `
        <div class="mypage-profile-icon-fallback">
          ☻
        </div>
      `;

    profileSummary.innerHTML = `
      <div class="form-box" style="margin-bottom:20px;">

        <div class="mypage-profile-top">
          ${iconHtml}

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

        <div class="mypage-stats">
          <div>
            <strong>${postCount}</strong>
            <span>POSTS</span>
          </div>

          <div
            class="stat-clickable"
            onclick="location.href='following.html?uid=${user.uid}'"
          >
            <strong>${followCounts.following}</strong>
            <span>FOLLOW</span>
          </div>

          <div>
            <strong>${followCounts.followers}</strong>
            <span>FOLLOWERS</span>
          </div>
        </div>

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
      return 0;
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

    return myOutfits.length;

  } catch (error) {
    console.error(error);
    outfitList.innerHTML =
      `<p class="empty">自分の投稿を読み込めませんでした。</p>`;
    return 0;
  }
}

async function deleteAccount() {
  const user = auth.currentUser;

  if (!user) {
    alert("ログインしてください");
    return;
  }

  const password = deletePassword.value.trim();

  if (!password) {
    alert("退会するにはパスワードを入力してください");
    return;
  }

  const confirmText =
    "本当に退会しますか？\nアカウント、プロフィール、投稿、フォロー情報はすべて削除されます。";

  if (!confirm(confirmText)) {
    return;
  }

  try {
    deleteAccountBtn.disabled = true;
    deleteAccountBtn.textContent = "削除中...";

    const credential =
      EmailAuthProvider.credential(user.email, password);

    await reauthenticateWithCredential(user, credential);

    const outfitsQuery = query(
      collection(db, "outfits"),
      where("ownerId", "==", user.uid)
    );

    const outfitsSnap = await getDocs(outfitsQuery);

    for (const outfitDoc of outfitsSnap.docs) {
      await deleteDoc(doc(db, "outfits", outfitDoc.id));
    }

    const outfitsUserQuery = query(
      collection(db, "outfits"),
      where("userId", "==", user.uid)
    );

    const outfitsUserSnap = await getDocs(outfitsUserQuery);

    for (const outfitDoc of outfitsUserSnap.docs) {
      await deleteDoc(doc(db, "outfits", outfitDoc.id));
    }

    const followingQuery = query(
      collection(db, "follows"),
      where("followerId", "==", user.uid)
    );

    const followingSnap = await getDocs(followingQuery);

    for (const followDoc of followingSnap.docs) {
      await deleteDoc(doc(db, "follows", followDoc.id));
    }

    const followersQuery = query(
      collection(db, "follows"),
      where("followingId", "==", user.uid)
    );

    const followersSnap = await getDocs(followersQuery);

    for (const followDoc of followersSnap.docs) {
      await deleteDoc(doc(db, "follows", followDoc.id));
    }

    await deleteDoc(doc(db, "profiles", user.uid));

    await deleteUser(user);

    alert("退会しました。");
    location.href = "index.html";

  } catch (error) {
    console.error(error);

    deleteAccountBtn.disabled = false;
    deleteAccountBtn.textContent = "退会する";

    if (error.code === "auth/wrong-password") {
      alert("パスワードが違います。");
      return;
    }

    if (error.code === "auth/requires-recent-login") {
      alert("安全のため、もう一度ログインしてから退会してください。");
      return;
    }

    alert("退会処理に失敗しました。Firestoreルールも確認してください。");
  }
}

onAuthStateChanged(auth, async user => {
  if (user) {
    authBox.style.display = "none";
    myPageArea.style.display = "block";

    if (loginUserEmail) {
      loginUserEmail.textContent = user.email;
    }

    const postCount = await loadMyOutfits(user);
    await loadProfile(user, postCount);

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

if (deleteAccountBtn) {
  deleteAccountBtn.addEventListener("click", deleteAccount);
}