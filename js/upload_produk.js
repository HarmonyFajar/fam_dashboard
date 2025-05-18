document.addEventListener("DOMContentLoaded", async function () {
    try {
      const form = document.getElementById("productForm");
      if (!form) return;
  
      const database = firebase.database();
      const storage = firebase.storage();
  
      const urlParams = new URLSearchParams(window.location.search);
      const editId = urlParams.get("id");
  
      // Isi form jika edit mode
      if (editId) {
        const snapshot = await database.ref("produk/" + editId).once("value");
        const data = snapshot.val();
        if (data) {
          document.getElementById("name").value = data.name;
          document.getElementById("sku").value = data.sku;
          document.getElementById("stock").value = data.stock;
          document.getElementById("price").value = data.price;
          document.getElementById("category").value = data.category;
          document.getElementById("desc").value = data.desc;
          document.getElementById("previewImage").src = data.imageUrl;
          document.getElementById("previewImage").style.display = "block";
          form.setAttribute("data-edit-id", editId);
        }
      }
  
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
          alert("⚠️ Semua field wajib diisi!");
          return;
        }
  
        if (!imageFile && !isEdit) {
          alert("⚠️ Silakan upload foto produk terlebih dahulu.");
          return;
        }
  
        try {
          let imageUrl = "";
  
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
  
          const productData = {
            name,
            sku,
            stock: parseInt(stock),
            price: parseInt(price),
            category,
            desc,
            imageUrl
          };
  
          if (isEdit) {
            await database.ref("produk/" + isEdit).update(productData);
            alert("✅ Produk berhasil diperbarui!");
          } else {
            await database.ref("produk/" + sku).set(productData);
            alert("✅ Produk baru berhasil ditambahkan!");
          }
  
          form.reset();
          document.getElementById("previewImage").style.display = "none";
          window.location.href = "load_products.html";
        } catch (err) {
          console.error("❌ Error:", err);
          alert("❌ Gagal menyimpan data.");
        }
      });
    } catch (err) {
      console.error("❌ Script error:", err);
    }
  });
  
  // Preview gambar otomatis
  document.getElementById("image").addEventListener("change", function (e) {
    const file = e.target.files[0];
    const preview = document.getElementById("previewImage");
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  
