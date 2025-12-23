const API_URL = "/api/products";
const CAT_API_URL = "/api/categories";

let products = [];
let categories = [];
let currentFilter = "Tümü";
let tempImageBase64 = "";
const defaultImg = "https://via.placeholder.com/50x50?text=Yok";

async function fetchJson(url) {
    try {
        const res = await fetch(url);
        return res.ok ? await res.json() : [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function sendRequest(url, method, data = null) {
    try {
        const options = { method };
        if (data) {
            options.headers = { "Content-Type": "application/json" };
            options.body = JSON.stringify(data);
        }

        if (typeof data === "string") {
            delete options.headers;
            options.body = data;
        }

        const res = await fetch(url, options);
        return res.ok;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function handleLogin(e) {
    e.preventDefault();
    if (document.getElementById("password").value === "admin") {
        document.getElementById("login-page").style.display = "none";
        document.getElementById("admin-panel").style.display = "flex";
        loadData();
    } else {
        document.getElementById("login-error").style.display = "block";
    }
}

async function loadData() {
    [categories, products] = await Promise.all([fetchJson(CAT_API_URL), fetchJson(API_URL)]);
    renderFilterTabs();
    renderProductTable();
}

async function saveProduct(e) {
    e.preventDefault();
    const idInput = document.getElementById("prod-id").value;

    const productData = {
        id: idInput ? parseInt(idInput) : Date.now(),
        name: document.getElementById("prod-name").value,
        category: document.getElementById("prod-cat").value,
        price: parseFloat(document.getElementById("prod-price").value),
        stock: parseInt(document.getElementById("prod-stock").value),
        image: tempImageBase64 || defaultImg,
    };

    if (await sendRequest(API_URL, "POST", productData)) {
        closeModal();
        await loadData();
    } else {
        alert("Kaydetme başarısız.");
    }
}

async function deleteProduct(id) {
    if (confirm("Silmek istediğine emin misin?")) {
        if (await sendRequest(`${API_URL}?id=${id}`, "DELETE")) {
            await loadData();
        } else {
            alert("Silinemedi.");
        }
    }
}

async function addCategory(e) {
    e.preventDefault();
    const input = document.getElementById("new-cat-name");
    const newCat = input.value.trim();

    if (newCat && !categories.includes(newCat)) {
        if (await sendRequest(CAT_API_URL, "POST", newCat)) {
            input.value = "";
            await loadData();
            if (document.getElementById("view-categories").classList.contains("active")) {
                renderCategoryTable();
            }
            alert("Kategori eklendi!");
        }
    } else {
        alert("Geçersiz veya mükerrer kategori.");
    }
}

async function deleteCategory(index) {
    const cat = categories[index];
    if (confirm(`${cat} silinsin mi?`)) {
        if (await sendRequest(`${CAT_API_URL}?name=${encodeURIComponent(cat)}`, "DELETE")) {
            await loadData();
            renderCategoryTable();
        }
    }
}

function switchView(viewName, menuItem) {
    document.querySelectorAll(".menu-item").forEach((el) => el.classList.remove("active"));
    if (menuItem) menuItem.classList.add("active");

    document.querySelectorAll(".view-section").forEach((el) => el.classList.remove("active"));
    document.getElementById(`view-${viewName}`).classList.add("active");

    if (viewName === "products") {
        renderFilterTabs();
        renderProductTable();
    } else if (viewName === "categories") {
        renderCategoryTable();
    }
}

function renderProductTable() {
    const tbody = document.getElementById("product-list");
    const data = currentFilter === "Tümü" ? products : products.filter((p) => p.category === currentFilter);

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999;">Kayıt bulunamadı.</td></tr>';
        return;
    }

    tbody.innerHTML = data
        .map(
            (p) => `
        <tr>
            <td><img src="${p.image || defaultImg}" class="table-img" alt="img"></td>
            <td>${p.name}</td>
            <td><span style="background:#eee; padding:2px 8px; border-radius:10px; font-size:0.85em">${p.category}</span></td>
            <td>${p.price.toFixed(2)} TL</td>
            <td>${p.stock}</td>
            <td class="action-btns">
                <button class="btn btn-green btn-sm" onclick="openProductModal('edit', ${p.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `
        )
        .join("");
}

function renderCategoryTable() {
    document.getElementById("category-list-table").innerHTML = categories
        .map(
            (cat, index) => `
        <tr>
            <td>${cat}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteCategory(${index})">Sil</button></td>
        </tr>
    `
        )
        .join("");
}

function renderFilterTabs() {
    const container = document.getElementById("filter-container");
    const allBtn = `<button class="tab-btn ${currentFilter === "Tümü" ? "active" : ""}" onclick="applyFilter('Tümü')">Tümü</button>`;

    const catBtns = categories.map((cat) => `<button class="tab-btn ${currentFilter === cat ? "active" : ""}" onclick="applyFilter('${cat}')">${cat}</button>`).join("");

    container.innerHTML = allBtn + catBtns;
}

function applyFilter(catName) {
    currentFilter = catName;
    renderFilterTabs();
    renderProductTable();
}

function openProductModal(mode, id = null) {
    const modal = document.getElementById("product-modal");
    const select = document.getElementById("prod-cat");

    select.innerHTML = categories.map((c) => `<option value="${c}">${c}</option>`).join("");
    document.getElementById("prod-img-input").value = "";
    tempImageBase64 = "";
    modal.style.display = "flex";

    if (mode === "add") {
        document.getElementById("modal-title").innerText = "Yeni Ürün Ekle";
        clearInputs();
        togglePreview(false);
    } else {
        const p = products.find((x) => x.id === id);
        document.getElementById("modal-title").innerText = "Ürünü Düzenle";
        fillInputs(p);

        if (p.image && p.image !== defaultImg) {
            document.getElementById("modal-preview-img").src = p.image;
            togglePreview(true);
            tempImageBase64 = p.image;
        } else {
            togglePreview(false);
        }
    }
}

function handleImagePreview(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById("modal-preview-img").src = e.target.result;
            togglePreview(true);
            tempImageBase64 = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function togglePreview(show) {
    document.getElementById("modal-preview-img").style.display = show ? "block" : "none";
    document.getElementById("preview-text").style.display = show ? "none" : "block";
}

function clearInputs() {
    document.getElementById("prod-id").value = "";
    document.getElementById("prod-name").value = "";
    document.getElementById("prod-price").value = "";
    document.getElementById("prod-stock").value = "";
}

function fillInputs(p) {
    document.getElementById("prod-id").value = p.id;
    document.getElementById("prod-name").value = p.name;
    document.getElementById("prod-cat").value = p.category;
    document.getElementById("prod-price").value = p.price;
    document.getElementById("prod-stock").value = p.stock;
}

function closeModal() {
    document.getElementById("product-modal").style.display = "none";
}

function logout() {
    location.href = "/";
}

window.onclick = function (e) {
    if (e.target == document.getElementById("product-modal")) closeModal();
};
