import { db, auth } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const notificationList =
  document.getElementById("notificationList");

onAuthStateChanged(auth, async user => {
  if (!user) {
    notificationList.innerHTML =
      `<p class="empty">ログインすると通知を確認できます。</p>`;
    return;
  }

  await loadNotifications(user);
});

async function loadNotifications(user) {
  const q = query(
    collection(db, "notifications"),
    where("toUserId", "==", user.uid)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    notificationList.innerHTML =
      `<p class="empty">まだ通知はありません。</p>`;
    return;
  }

  const notifications =
    snap.docs
      .map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      }))
      .sort((a, b) => {
        const aTime =
          a.createdAt?.seconds || 0;
        const bTime =
          b.createdAt?.seconds || 0;

        return bTime - aTime;
      });

  notificationList.innerHTML = "";

  for (const data of notifications) {
    let fromName = "誰か";

    if (data.fromUserId) {
      const profileSnap = await getDoc(
        doc(db, "profiles", data.fromUserId)
      );

      if (profileSnap.exists()) {
        fromName =
          profileSnap.data().displayName || "NO NAME";
      }
    }

    const div = document.createElement("div");
    div.className = "notification-item";

    let message = "";
    let button = "";

    if (data.type === "follow") {
      message =
        `<strong>${fromName}</strong> さんがあなたをフォローしました。`;

      button = `
        <button
          class="small-btn"
          onclick="location.href='user.html?uid=${data.fromUserId}'"
        >
          プロフィールを見る
        </button>
      `;
    }

    if (data.type === "favorite") {
      message =
        `<strong>${fromName}</strong> さんがあなたのコーデを保存しました♡`;

      button = `
        <button
          class="small-btn"
          onclick="location.href='outfit.html?id=${data.outfitId || data.postId}'"
        >
          投稿を見る
        </button>
      `;
    }

    div.innerHTML = `
      <p>${message}</p>
      ${button}
    `;

    notificationList.appendChild(div);

    if (data.read === false) {
      await updateDoc(
        doc(db, "notifications", data.id),
        {
          read: true
        }
      );
    }
  }
}