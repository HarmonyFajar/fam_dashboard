// js/upload_produk.js (VERSI LENGKAP & SUDAH DIPERBAIKI)

// Menunggu seluruh halaman HTML siap sebelum menjalankan script
document.addEventListener("DOMContentLoaded", function () {
    try {
        // 1. Inisialisasi Firebase & Elemen DOM
        const form = document.getElementById("productForm");
        if (!form) {
            console.error("Form dengan ID 'productForm' tidak ditemukan!");
            return;
        }

        const database = firebase.database();
        const storage = firebase.storage();

        // 2. Cek apakah ini mode EDIT atau mode ADD
        // Mode edit jika ada parameter 'id' di URL (contoh: ...?id=-Mxyz123)
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get("id");

        // 3. Jika ini mode EDIT, isi form dengan data yang sudah ada
        if (editId) {
            document.querySelector('h1').textContent = 'Edit Product'; // Ganti judul halaman
            form.setAttribute("data-edit-id", editId); // Tandai form sebagai mode edit

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
                    alert('Produk dengan ID ini tidak ditemukan!');
                }
            });
        }

        // 4. Tambahkan event listener saat form di-SUBMIT (tombol SAVE diklik)
        form.addEventListener("submit", async function (e) {
            e.preventDefault(); // Mencegah halaman refresh

            // Ambil semua nilai dari form
            const name = document.getElementById("name").value.trim();
            const sku = document.getElementById("sku").value.trim();
            const stock = document.getElementById("stock").value.trim();
            const price = document.getElementById("price").value.trim();
            const category = document.getElementById("category").value;
            const desc = document.getElementById("desc").value.trim();
            const imageFile = document.getElementById("image").files[0];
            const isEdit = form.getAttribute("data-edit-id");

            // Validasi input
            if (!name || !sku || !stock || !price || !category || !desc) {
                alert("⚠️ Semua field wajib diisi!");
                return;
            }
            if (!imageFile && !isEdit) { // Wajib upload gambar jika ini produk BARU
                alert("⚠️ Silakan upload foto produk terlebih dahulu.");
                return;
            }

            // Nonaktifkan tombol save untuk mencegah double-click
            const saveButton = form.querySelector('button[type="submit"]');
            saveButton.disabled = true;
            saveButton.textContent = 'Menyimpan...';

            try {
                let imageUrl = "";

                // Jika ada file gambar baru yang diupload (baik mode add atau edit)
                if (imageFile) {
                    const timestamp = Date.now();
                    const imageName = `${timestamp}_${imageFile.name}`;
                    const storageRef = storage.ref("produk_images/" + imageName);
                    const snapshot = await storageRef.put(imageFile);
                    imageUrl = await snapshot.ref.getDownloadURL();
                } else if (isEdit) {
                    // Jika mode edit tapi TIDAK ganti gambar, pakai URL gambar yang lama
                    const snapshot = await database.ref("produk/" + isEdit).once("value");
                    imageUrl = snapshot.val().imageUrl || "";
                }

                // Siapkan objek data produk
                const productData = {
                    name,
                    sku,
                    stock: parseInt(stock),
                    price: parseInt(price),
                    category,
                    desc,
                    imageUrl,
                    lastUpdated: firebase.database.ServerValue.TIMESTAMP // Catat waktu update
                };

                // Tentukan aksi: UPDATE (edit) atau SET (add baru)
                if (isEdit) {
                    // Jika mode edit, perbarui data yang ada
                    await database.ref("produk/" + isEdit).update(productData);
                    alert("✅ Produk berhasil diperbarui!");
                } else {
                    // =========================================================
                    // INI BAGIAN PENTING YANG DIPERBAIKI
                    // Jika produk baru, gunakan push() untuk membuat ID unik
                    const newProductRef = database.ref("produk").push();
                    await newProductRef.set(productData);
                    // =========================================================
                    alert("✅ Produk baru berhasil ditambahkan!");
                }

                // Setelah berhasil, reset form dan arahkan ke halaman daftar produk
                form.reset();
                document.getElementById("previewImage").style.display = "none";
                window.location.href = "load_products.html";

            } catch (err) {
                console.error("❌ Error saat menyimpan data:", err);
                alert("❌ Gagal menyimpan data. Cek console (F12) untuk detail error.");
                // Aktifkan lagi tombol jika terjadi error
                saveButton.disabled = false;
                saveButton.textContent = 'Save';
            }
        });

    } catch (err) {
        console.error("❌ Terjadi error pada script:", err);
    }
});

// 5. Script untuk menampilkan preview gambar saat dipilih
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

  
