let allProducts = [];
let categories = [];
let cart = [];

window.onload = async () => {
    await fetchCategories();
    await fetchProducts();
};

async function fetchCategories() {
    try {
        const response = await fetch("/api/categories");
        if (response.ok) {
            categories = await response.json();
            renderCategoryButtons();
        }
    } catch (error) {
        console.error(error);
    }
}

async function fetchProducts() {
    try {
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Veri çekilemedi");

        allProducts = await response.json();
        filterCategory("Tümü");
    } catch (error) {
        console.error(error);
        alert("Ürünler sunucudan yüklenemedi!");
    }
}

function renderCategoryButtons() {
    const container = document.getElementById("category-container");
    let html = `<button class="category-btn active" onclick="filterCategory('Tümü')">Tümü</button>`;

    categories.forEach((cat) => {
        html += `<button class="category-btn" onclick="filterCategory('${cat}')">${cat}</button>`;
    });

    container.innerHTML = html;
}

function filterCategory(category) {
    const grid = document.getElementById("fastProducts");
    grid.innerHTML = "";

    document.querySelectorAll(".category-btn").forEach((btn) => {
        btn.classList.remove("active");
        if (btn.innerText === category) btn.classList.add("active");
    });

    const filtered = category === "Tümü" ? allProducts : allProducts.filter((p) => p.category === category);

    filtered.forEach((p) => {
        grid.innerHTML += `
            <div class="product-item" onclick="addToCart(${p.id})">
                <div class="product-img-container">
                    <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/100x80?text=Resim+Yok'">
                </div>
                <div class="product-info">
                    <strong>${p.name}</strong>
                    <span>${p.price.toFixed(2)} TL</span>
                </div>
            </div>`;
    });
}

function addToCart(productId) {
    const product = allProducts.find((p) => p.id === productId);
    const existingItem = cart.find((item) => item.id === productId);
    if (existingItem) existingItem.qty++;
    else cart.push({ ...product, qty: 1 });
    updateUI();
}

function changeQty(index, amount) {
    cart[index].qty += amount;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    updateUI();
}

function updateUI() {
    const list = document.getElementById("cartItems");
    const totalDisplay = document.getElementById("grandTotal");
    list.innerHTML = "";
    let total = 0;

    cart.forEach((item, index) => {
        list.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td style="text-align:center;">
                    <button onclick="changeQty(${index}, -1)" style="width:20px; cursor:pointer;">-</button>
                    <span style="margin:0 5px">${item.qty}</span>
                    <button onclick="changeQty(${index}, 1)" style="width:20px; cursor:pointer;">+</button>
                </td>
                <td>${(item.price * item.qty).toFixed(2)} TL</td>
                <td><button onclick="changeQty(${index}, -999)" style="cursor:pointer; background:none; border:none; color:red;">✕</button></td>
            </tr>`;
        total += item.price * item.qty;
    });
    totalDisplay.innerText = total.toFixed(2) + " TL";
}

function completeSale() {
    if (cart.length === 0) return alert("Sepet boş!");

    alert("Satış Tamamlandı!");
    cart = [];
    updateUI();
}
