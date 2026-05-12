import { db, auth } from "./firebase.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const style = document.createElement("style");

style.textContent = `
.notification-bell {
  position: fixed;
  right: 18px;
  bottom: 86px;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #d9eef5;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 22px;
  z-index: 9999;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ff5b7f;
  color: #ffffff;
  font-size: 11px;
  font-weight: 900;
  display: none;
  align-items: center;
  justify-content: center;
}
`;

document.head.appendChild(style);

const bell = document.createElement("a");
bell.href = "notifications.html";
bell.className = "notification-bell";
bell.innerHTML = `
  🔔
  <span class="notification-badge" id="notificationBadge">0</span>
`;

document.body.appendChild(bell);

const badge = document.getElementById("notificationBadge");

onAuthStateChanged(auth, user => {
  if (!user) {
    badge.style.display = "none";
    return;
  }

  const q = query(
    collection(db, "notifications"),
    where("toUserId", "==", user.uid),
    where("read", "==", false)
  );

  onSnapshot(q, snap => {
    const count = snap.size;

    if (count <= 0) {
      badge.style.display = "none";
      return;
    }

    badge.textContent = count > 99 ? "99+" : count;
    badge.style.display = "flex";
  });
});