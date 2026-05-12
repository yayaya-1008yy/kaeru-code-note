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

const displayNameInput = document.getElementById("displayName");
const bioTextInput = document.getElementById("bioText");
const heightInput = document.getElementById("height");
const bodyTypeInput = document.getElementById("bodyType");
const usualSizeInput = document.getElementById("usualSize");
const favoriteStyleInput = document.getElementById("favoriteStyle");
const favoriteColorInput = document.getElementById("favoriteColor");

const iconInput = document.getElementById("iconInput");
const iconPreview = document.getElementById("iconPreview");

const saveProfileBtn = document.getElementById("saveProfileBtn");

let currentUser = null;
let selectedIconImage = "";

onAuthStateChanged(auth, user => {

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

    const reader =
      new FileReader();

    reader.onload = e => {

      const img =
        new Image();

      img.onload = () => {

        const size = 300;

        const canvas =
          document.createElement("canvas");

        const ctx =
          canvas.getContext("2d");

        canvas.width = size;
        canvas.height = size;

        ctx.clearRect(0, 0, size, size);

        ctx.save();

        ctx.beginPath();

        ctx.arc(
          size / 2,
          size / 2,
          size / 2,
          0,
          Math.PI * 2
        );

        ctx.closePath();

        ctx.clip();

        const scale = Math.max(
          size / img.width,
          size / img.height
        );

        const drawWidth =
          img.width * scale;

        const drawHeight =
          img.height * scale;

        const dx =
          (size - drawWidth) / 2;

        const dy =
          (size - drawHeight) / 2;

        ctx.drawImage(
          img,
          dx,
          dy,
          drawWidth,
          drawHeight
        );

        ctx.restore();

        resolve(
          canvas.toDataURL("image/png")
        );

      };

      img.src = e.target.result;

    };

    reader.readAsDataURL(file);

  });

}

if (iconInput) {

  iconInput.addEventListener(
    "change",
    async () => {

      if (
        !iconInput.files ||
        !iconInput.files[0]
      ) return;

      selectedIconImage =
        await compressIcon(
          iconInput.files[0]
        );

      iconPreview.src =
        selectedIconImage;

      iconPreview.style.display =
        "block";

    }
  );

}

async function loadProfile() {

  try {

    const profileRef =
      doc(
        db,
        "profiles",
        currentUser.uid
      );

    const profileSnap =
      await getDoc(profileRef);

    if (!profileSnap.exists()) return;

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

    if (data.iconImage) {

      selectedIconImage =
        data.iconImage;

      iconPreview.src =
        data.iconImage;

      iconPreview.style.display =
        "block";

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

      doc(
        db,
        "profiles",
        currentUser.uid
      ),

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

        iconImage:
          selectedIconImage,

        updatedAt:
          Date.now()

      },

      { merge: true }

    );

    alert(
      "プロフィールを保存しました！"
    );

  } catch (error) {

    console.error(error);

    alert(
      "保存に失敗しました"
    );

  }

}