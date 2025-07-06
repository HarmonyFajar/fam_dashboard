// ======== TOAST FUNCTION =========
function showToast(message, type = "success") {
  const toastBox = document.getElementById("toastBox");
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.padding = "12px 20px";
  toast.style.marginTop = "10px";
  toast.style.borderRadius = "6px";
  toast.style.color = "#fff";
  toast.style.fontSize = "14px";
  toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
  toast.style.background = type === "error" ? "#e53935" : "#43a047";
  toast.style.transition = "opacity 0.3s ease";
  toastBox.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ======== MAIN SCRIPT =========
document.addEventListener("DOMContentLoaded", function () {
  try {
    // 🔐 Anonymous Login
    firebase.auth().signInAnonymously()
      .then(() => console.log("✅ Logged in anonymously"))
      .catch(err => showToast("Login gagal: " + err.message, "error"));

    const form = document.getElementById("productForm");
    if (!form) {
      showToast("Form tidak ditemukan!", "error");
      return;
    }

    const database = firebase.database();
    const storage = firebase.storage();
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("id");

    // 📥 Prefill untuk Edit Mode
    if (editId) {
      document.querySelector('h1').textContent = 'Edit Product';
      form.setAttribute("data-edit-id", editId);

      database.ref("produk/" + editId).once("value").then(snapshot => {
        const data = snapshot.val();
        if (data) {
          document.getElementById("name").value = data.name || '';
          document.getElementById("sku").value = data.sku || '';
          document.getElementById("stock").value = data.stock || 0;
          document.getElementById("price").value = data.price || 0;
          document.getElementById("category").value = data.category || '';
          document.getElementById("desc").value = data.desc || '';
          if (data.imageUrl) {
            const preview = document.getElementById("previewImage");
            preview.src = data.imageUrl;
            preview.style.display = "block";
          }
        } else {
          showToast("Produk tidak ditemukan!", "error");
        }
      });
    }

    // 📤 Submit Handler
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const sku = document.getElementById("sku").value.trim();
      const stock = document.getElementById("stock").value.trim();
      const price = document.getElementById("price").value.trim();
      const category = document.getElementById("category").value;
      const desc = document.getElementById("desc").value.trim();
      const imageFile = document.getElementById("image").files[0];
      const isEdit = form.getAttribute("data-edit-id");

      if (!name || !sku || !stock || !price || !category || !desc) {
        showToast("⚠️ Semua field wajib diisi!", "error");
        return;
      }

      if (!imageFile && !isEdit) {
        showToast("⚠️ Silakan upload foto produk terlebih dahulu.", "error");
        return;
      }

      const saveButton = form.querySelector('button[type="submit"]');
      saveButton.disabled = true;
      saveButton.textContent = 'Menyimpan...';

      try {
        let imageUrl = "";

        // 📦 Upload image ke Storage
        if (imageFile) {
          const timestamp = Date.now();
          const imageName = `${timestamp}_${imageFile.name}`;
          const storageRef = storage.ref("produk_images/" + imageName);
          const snapshot = await storageRef.put(imageFile);
          imageUrl = await snapshot.ref.getDownloadURL();
        } else if (isEdit) {
          const snapshot = await database.ref("produk/" + isEdit).once("value");
          imageUrl = snapshot.val().imageUrl || "";
        }

        // 📝 Data Produk
        const productData = {
          name,
          sku,
          stock: parseInt(stock),
          price: parseInt(price),
          category,
          desc,
          imageUrl,
          lastUpdated: firebase.database.ServerValue.TIMESTAMP
        };

        // 🧾 Simpan ke Database
        if (isEdit) {
          await database.ref("produk/" + isEdit).update(productData);
          showToast("✅ Produk berhasil diperbarui!");
        } else {
          const newRef = database.ref("produk").push();
          await newRef.set(productData);
          showToast("✅ Produk berhasil ditambahkan!");
        }

        form.reset();
        document.getElementById("previewImage").style.display = "none";
        window.location.href = "load_products.html";

      } catch (err) {
        console.error("❌ Error saat menyimpan data:", err);
        showToast("❌ Gagal menyimpan data: " + err.message, "error");
        saveButton.disabled = false;
        saveButton.textContent = 'Save';
      }
    });

  } catch (err) {
    console.error("❌ Script Error:", err);
    showToast("❌ Terjadi error dalam script.", "error");
  }
});

// 🖼️ Preview Gambar
document.getElementById("image").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const preview = document.getElementById("previewImage");
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      preview.src = event.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});


    
