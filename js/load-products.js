document.addEventListener("DOMContentLoaded", function () {
    const productList = document.getElementById("product-list");
    const dbRef = firebase.database().ref("produk");
  
    dbRef.once("value", (snapshot) => {
      productList.innerHTML = "";
      snapshot.forEach((child) => {
        const data = child.val();
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <img src="${data.imageUrl}" class="product-img" alt="${data.name}" />
          <h3>${data.name}</h3>
          <div class="sku">${data.sku}</div>
          <div class="stock">${data.stock} pcs</div>
          <div class="desc">${data.desc}</div>
          <div class="actions">
            <img src="images/icon-edit.png" title="Edit" />
            <img src="images/icon-delete.png" title="Delete" />
          </div>
        `;
        productList.appendChild(card);
      });
    });
  });
  