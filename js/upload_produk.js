<script>
document.addEventListener("DOMContentLoaded", function () {
    try {
        // 0. Firebase Anonymous Login (Wajib agar bisa upload)
        firebase.auth().signInAnonymously()
            .then(() => {
                console.log("✅ Login anonymous berhasil");
            })
            .catch((error) => {
                console.error("❌ Gagal login anonymous:", error);
            });

        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log("🔐 Auth aktif - UID:", user.uid);
            } else {
                console.warn("❌ Belum login Firebase");
            }
        });

        const form = document.getElementById("productForm");
        if (!form) {
            console.error("Form dengan ID 'productForm' tidak ditemukan!");
            return;
        }

        const database = firebase.database();
        const storage = firebase.storage();

        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get("id");

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
                    alert('Produk dengan ID ini tidak ditemukan!');
                }
            });
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

            const saveButton = form.querySelector('button[type="submit"]');
            saveButton.disabled = true;
            saveButton.textContent = 'Menyimpan...';

            try {
                let imageUrl = "";

                if (imageFile) {
                    const timestamp = Date.now();
                    const imageName = `${timestamp}_${imageFile.name}`;
                    const storageRef = storage.ref("produk_images/" + imageName);

                    // ⏳ Upload file ke Firebase Storage
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
                    imageUrl,
                    lastUpdated: firebase.database.ServerValue.TIMESTAMP
                };

                if (isEdit) {
                    await database.ref("produk/" + isEdit).update(productData);
                    alert("✅ Produk berhasil diperbarui!");
                } else {
                    const newProductRef = database.ref("produk").push();
                    await newProductRef.set(productData);
                    alert("✅ Produk baru berhasil ditambahkan!");
                }

                form.reset();
                document.getElementById("previewImage").style.display = "none";
                window.location.href = "load_products.html";

            } catch (err) {
                console.error("❌ Error saat menyimpan data:", err);
                alert("❌ Gagal menyimpan data. Cek console (F12) untuk detail error.");
                saveButton.disabled = false;
                saveButton.textContent = 'Save';
            }
        });

    } catch (err) {
        console.error("❌ Terjadi error pada script:", err);
    }
});

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
</script>


  
