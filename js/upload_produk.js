document.addEventListener("DOMContentLoaded", function () {
    try {
      const form = document.getElementById("productForm");
  
      if (!form) {
        console.error("❌ Form tidak ditemukan!");
        return;
      }
  
      const database = firebase.database();
      const storage = firebase.storage();
  
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        console.log("📦 Mulai upload produk...");
  
        const name = document.getElementById("name").value.trim();
        const sku = document.getElementById("sku").value.trim();
        const stock = document.getElementById("stock").value.trim();
        const price = document.getElementById("price").value.trim();
        const category = document.getElementById("category").value;
        const desc = document.getElementById("desc").value.trim();
        const imageFile = document.getElementById("image").files[0];
  
        if (!name || !sku || !stock || !price || !category || !desc || !imageFile) {
          alert("⚠️ Semua field wajib diisi!");
          return;
        }
  
        try {
          const timestamp = Date.now();
          const imageName = `${timestamp}_${imageFile.name}`;
          const storageRef = storage.ref("produk_images/" + imageName);
  
          const snapshot = await storageRef.put(imageFile);
          const imageUrl = await snapshot.ref.getDownloadURL();
  
          const newProduct = {
            name,
            sku,
            stock: parseInt(stock),
            price: parseInt(price),
            category,
            desc,
            imageUrl
          };
  
          await database.ref("produk/" + sku).set(newProduct);
  
          alert("✅ Produk berhasil diupload ke Firebase!");
          console.log("✅ Produk tersimpan:", newProduct);
          form.reset();
        } catch (err) {
          console.error("❌ Gagal upload produk:", err);
          alert("❌ Upload gagal. Cek console log.");
        }
      });
    } catch (err) {
      console.error("❌ Script error:", err);
    }
  });
  