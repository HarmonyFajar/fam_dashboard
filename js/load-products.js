document.addEventListener("DOMContentLoaded", function () {
  const productList = document.getElementById("product-list");

  // 🔐 Firebase Anonymous Login
  firebase.auth().signInAnonymously().catch((error) => {
    console.error("❌ Gagal login anonymous:", error);
  });

  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      console.warn("⚠️ Belum login. Data tidak bisa diambil.");
      return;
    }

    const dbRef = firebase.database().ref("produk");

    // 🔄 Realtime listener
    dbRef.on("value", (snapshot) => {
      productList.innerHTML = ""; // Clear existing

      if (!snapshot.exists()) {
        productList.innerHTML = "<p>Belum ada produk tersedia.</p>";
        return;
      }

      snapshot.forEach((child) => {
        const data = child.val();
        const key = child.key;

        // Buat elemen kartu produk
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <img src="${data.imageUrl}" class="product-img" alt="${data.name}" />
          <h3>${data.name}</h3>
          <div class="sku"><strong>SKU:</strong> ${data.sku}</div>
          <div class="stock"><strong>Stok:</strong> ${data.stock} pcs</div>
          <div class="desc">${data.desc}</div>
          <div class="actions">
            <img src="images/icon-edit.png" title="Edit" class="btn-edit" data-id="${key}" />
            <img src="images/icon-delete.png" title="Delete" class="btn-delete" data-id="${key}" />
          </div>
        `;

        productList.appendChild(card);
      });

      // 🔁 Event Edit
      document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", function () {
          const id = this.getAttribute("data-id");
          window.location.href = `stok_add_product.html?id=${id}`;
        });
      });

      // 🗑️ Event Delete
      document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", function () {
          const id = this.getAttribute("data-id");
          const konfirmasi = confirm("Yakin ingin menghapus produk ini?");
          if (konfirmasi) {
            firebase.database().ref("produk/" + id).remove()
              .then(() => {
                alert("Produk berhasil dihapus!");
                // Jangan reload kalau pakai .on(), data otomatis update
              })
              .catch(err => {
                alert("Gagal hapus produk: " + err.message);
              });
          }
        });
      });
    });
  });
});

