import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const auth = getAuth();

const followingList =
  document.getElementById("followingList");

onAuthStateChanged(auth, async user => {
  if (!user) {
    followingList.innerHTML =
      `<p class="empty">ログインしてください。</p>`;
    return;
  }

  const q = query(
    collection(db, "follows"),
    where("followerId", "==", user.uid)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    followingList.innerHTML =
      `<p class="empty">まだ誰もフォローしていません。</p>`;
    return;
  }

  followingList.innerHTML = "";

  for (const followDoc of snap.docs) {
    const followData = followDoc.data();

    const profileRef =
      doc(db, "profiles", followData.followingId);

    const profileSnap =
      await getDoc(profileRef);

    if (!profileSnap.exists()) continue;

    const profile =
      profileSnap.data();

    const card =
      document.createElement("article");

    card.className =
      "post-card";

    card.innerHTML = `
      <div class="card-body" style="text-align:center;">
        <div
          class="user-avatar"
          style="
            margin:0 auto 16px;
            ${profile.iconImage ? `background-image:url('${profile.iconImage}'); background-size:cover;` : ""}
          "
        >
          ${profile.iconImage ? "" : (profile.displayName || "U").slice(0,1)}
        </div>

        <h3>${profile.displayName || "NO NAME"}</h3>

        <p class="card-info">
          ${profile.bio || ""}
        </p>

        <button
          class="small-btn full-btn"
          onclick="location.href='user.html?uid=${followData.followingId}'"
        >
          プロフィールを見る
        </button>
      </div>
    `;

    followingList.appendChild(card);
  }
});