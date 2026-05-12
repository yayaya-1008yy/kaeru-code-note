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

const heightInput =
  document.getElementById("height");

const bodyTypeInput =
  document.getElementById("bodyType");

const usualSizeInput =
  document.getElementById("usualSize");

const favoriteStyleInput =
  document.getElementById("favoriteStyle");

const favoriteColorInput =
  document.getElementById("favoriteColor");

const iconInput =
  document.getElementById("iconInput");

const iconPreview =
  document.getElementById("iconPreview");

const saveProfileBtn =
  document.getElementById("saveProfileBtn");

let currentUser = null;
let iconImage = "";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("ログインしてください");
    location.href = "mypage.html";
    return;
  }

  currentUser = user;
  loadProfile();
});

function compressIcon(file) {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        const size = 80;

        const canvas =
          document.createElement("canvas");

        const ctx =
          canvas.getContext("2d");

        canvas.width = size;
        canvas.height = size;

        const minSide =
          Math.min(img.width, img.height);

        const sx =
          (img.width - minSide) / 2;

        const sy =
          (img.height - minSide) / 2;

        ctx.drawImage(
          img,
          sx,
          sy,
          minSide,
          minSide,
          0,
          0,
          size,
          size
        );

        const result =
          canvas.toDataURL("image/jpeg", 0.18);

        resolve(result);
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

if (iconInput) {
  iconInput.addEventListener("change", async () => {
    if (!iconInput.files || !iconInput.files[0]) return;

    iconImage =
      await compressIcon(iconInput.files[0]);

    iconPreview.src = iconImage;
    iconPreview.style.display = "block";
  });
}

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

      heightInput.value =
        data.height || "";

      bodyTypeInput.value =
        data.bodyType || "";

      usualSizeInput.value =
        data.usualSize || "";

      favoriteStyleInput.value =
        data.favoriteStyle || "";

      favoriteColorInput.value =
        data.favoriteColor || "";

      iconImage =
        data.iconImage || "";

      if (iconImage && iconPreview) {
        iconPreview.src = iconImage;
        iconPreview.style.display = "block";
      }
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

        height:
          heightInput.value.trim(),

        bodyType:
          bodyTypeInput.value.trim(),

        usualSize:
          usualSizeInput.value.trim(),

        favoriteStyle:
          favoriteStyleInput.value.trim(),

        favoriteColor:
          favoriteColorInput.value.trim(),

        iconImage,

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