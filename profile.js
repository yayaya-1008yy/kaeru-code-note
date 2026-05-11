import {
  auth,
  db
} from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const displayNameInput =
  document.getElementById("displayName");

const bioTextInput =
  document.getElementById("bioText");

const saveProfileBtn =
  document.getElementById("saveProfileBtn");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    alert("ログインしてください");

    location.href = "mypage.html";

    return;
  }

  currentUser = user;

  loadProfile();

});

async function loadProfile() {

  try {

    const profileRef =
      doc(db, "profiles", currentUser.uid);

    const profileSnap =
      await getDoc(profileRef);

    if (profileSnap.exists()) {

      const data =
        profileSnap.data();

      displayNameInput.value =
        data.displayName || "";

      bioTextInput.value =
        data.bio || "";

    }

  } catch (error) {

    console.error(error);

  }

}

saveProfileBtn.addEventListener(
  "click",
  saveProfile
);

async function saveProfile() {

  if (!currentUser) return;

  try {

    await setDoc(
      doc(db, "profiles", currentUser.uid),
      {
        uid: currentUser.uid,

        email: currentUser.email,

        displayName:
          displayNameInput.value.trim(),

        bio:
          bioTextInput.value.trim(),

        updatedAt:
          Date.now()
      }
    );

    alert("プロフィールを保存しました！");

  } catch (error) {

    console.error(error);

    alert("保存に失敗しました");

  }

}