import { db, auth } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc
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
    where("toUserId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    notificationList.innerHTML =
      `<p class="empty">まだ通知はありません。</p>`;
    return;
  }

  notificationList.innerHTML = "";

  for (const notificationDoc of snap.docs) {
    const data = notificationDoc.data();

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

    div.innerHTML = `
      <p>
        <strong>${fromName}</strong> さんがあなたをフォローしました。
      </p>

      <button
        class="small-btn"
        onclick="location.href='user.html?uid=${data.fromUserId}'"
      >
        プロフィールを見る
      </button>
    `;

    notificationList.appendChild(div);
  }
}