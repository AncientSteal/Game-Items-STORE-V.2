
window.createToast = function (text, type='success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${text}</span>
            <button onclick="this.parentElement.remove()" style="background:none; border:none; color:gray; cursor:pointer; margin-left:10px;">✕</button>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
};

document.addEventListener('DOMContentLoaded', () => {
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    document.addEventListener('click', function(e) {
        const addBtn = e.target.closest('.ajax-add-btn');
        const removeBtn = e.target.closest('.ajax-remove-btn');

        if (addBtn) {
            const url = addBtn.getAttribute('data-url');
            fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'X-Requested-Width': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                createToast(data.message, data.status);
                const itemId = addBtn.getAttribute('data-item-id');
                const qtyEl = document.getElementById(`item-qty-${itemId}`);
                const totalEl = document.getElementById(`item-total-${itemId}`);
                const cartTotalEl = document.getElementById('cart-total-price');
                const isLimit = data.is_limit;

                toggleButtonState(addBtn, isLimit);

                if (qtyEl) qtyEl.innerText = data.quantity;
                if (totalEl) totalEl.innerText = data.item_total + ' моры.';
                if (cartTotalEl) cartTotalEl.innerText = data.total_price;

                if (data.status === 'warning') {
                    addBtn.disabled = true;
                    addBtn.innerText = "Больше нет на складе";
                    addBtn.style.opacity = "0.5";
                }
                updateCartCounter(data.cart_count);
            })
            .catch(err => console.error('Ошибка при добавлении:', err));
        }
        else if (removeBtn) {
                const url = removeBtn.getAttribute('data-url');
                const itemId = removeBtn.getAttribute('data-item-id');

                fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.action === 'updated') {
                        const qtyEl = document.getElementById(`item-qty-${itemId}`);
                        const itemTotalEl = document.getElementById(`item-total-${itemId}`);

                        if (qtyEl) qtyEl.innerText = data.quantity;
                        if (itemTotalEl) itemTotalEl.innerText = data.item_total + ' моры. ';

                        const row = document.getElementById(`item-row-${itemId}`);
                        if (row) {
                            const addBtnRow = row.querySelector('.ajax-add-btn');
                            if (addBtnRow) {
                                toggleButtonState(addBtnRow, data.isLimit);
                            }
                        }
                    } else {
                        const row = document.getElementById(`item-row-${itemId}`);
                        if (row) {
                            row.classList.add('removing');
                            setTimeout(() => {
                                row.remove();
                                if (data.cart_count === 0) {
                                    location.reload();
                                }
                            }, 400);
                        }
                    }
                    const cartTotalEl = document.getElementById('cart-total-price');
                    if (cartTotalEl) {
                        cartTotalEl.innerText = data.total_price;
                    }
                    updateCartCounter(data.cart_count);
                    if (data.cart_count === 0) {
                        const checkoutSection = document.getElementById('checkout-section');
                        const emptyMessage = document.getElementById('empty-cart-message');
                        const table = document.querySelector('.cart-table');
                        const total = document.querySelector('.cart-total');

                        if (table) table.style.display = 'none';
                        if (checkoutSection) checkoutSection.style.display = 'none';
                        if (total) total.style.display = 'none';
                        if (emptyMessage) emptyMessage.style.display = 'block';

                        createToast("Корзина пуста", "warning");
                    }
                })
                .catch(error => {
                console.error('Ошибка удаления:', error);
                createToast("Произошла ошибка при удалении товара", "error");
            });
        }
    });

    function toggleButtonState(btn, isLimit, totalStock) {
        if (totalStock <= 0) {
            btn.disabled = true;
            btn.innerText = "Нет в наличии";
            return;
        }

        const isLargeButton = btn.classList.contains('buy-button') || btn.classList.contains('buy-button-detail');

        if (isLimit) {
            btn.disabled = true;
            btn.innerText = isLargeButton ? "Больше нет в наличии" : "+";
            btn.style.opacity = "0.5";
            btn.style.cursor = "default";
        } else {
            btn.disabled = false;
            btn.innerText = isLargeButton ? "В корзину" : "+";
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
        }
    }

    function updateCartCounter(count) {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) cartCount.innerText = count;
    }


    const burger = document.getElementById('burger-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menu-overlay');

    burger.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        burger.classList.toggle('open');
        overlay.classList.toggle('active');
        console.log('клик по бургеру')
    });

    document.addEventListener('click', function(event) {
    if (!sidebar.contains(event.target) && !burger.contains(event.target)) {
        sidebar.classList.remove('active');
    }
    });

    overlay.addEventListener('click', function() {
        sidebar.classList.remove('active');
        burger.classList.remove('open');
        overlay.classList.remove('active');
    })

    const searchInput = document.getElementById('live-search');
    const productGrid = document.getElementById('product-grid');
    let debounceTimer;

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);

            if (anchor) anchor.style.display = 'none';
            const loader = document.getElementById('loading-indicator');
            if (loader) loader.style.display = 'none';

            const query = this.value;
            currentPage = 1;
            hasNextPage = true;
            if (scrollObserver && anchor) {
                anchor.style.display = 'block';
                scrollObserver.observe(anchor);
            }

            debounceTimer = setTimeout(() => {
                fetch(`/item-search-ajax/?q=${query}`, {
                    headers: { 'X-Requested-Width': 'XMLHttpRequest' }
                })
                .then(response => response.json())
                .then(data => {
                    productGrid.innerHTML = data.html;
                    const newCards = productGrid.querySelectorAll('.product-card');
                    newCards.forEach((card, index) => {
                        if (index < 8) {
                            setTimeout(() => card.classList.add('show'), index * 100);
                        }
                        if (window.productObserver) {
                        window.productObserver.observe(card);
                        }
                    });
                });
            }, 300);
        });
    }

    const heroImgLayer = document.querySelector('.type-character .item-image-layer');
    if (heroImgLayer) {
        setTimeout(() => {
            heroImgLayer.classList.add('appear');
        }, 100);
    }

    if (window.innerWidth >= 1024) {
        document.addEventListener('mousemove', (e) => {
            const heroImg = document.querySelector('.type-character .item-image-layer.appear img');
            if (heroImg) {
                const x = (e.clientX / window.innerWidth) - 0.5;
                const y = (e.clientY / window.innerHeight) - 0.5;
                heroImg.style.transform = `translate(${x * 10}px, ${y * 10}px)`
            }
        });
    }

    let currentPage = 1;
    let isLoading = false;
    hasNextPage = true;
    const anchor = document.getElementById('scroll-anchor');
    let scrollObserver;

    if (anchor) {
        scrollObserver = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && !isLoading && hasNextPage) {
                setTimeout(loadMoreItems, 200);
            }
        }, {threshold: 0.1});
        scrollObserver.observe(anchor);
    }

    function loadMoreItems() {
        if (isLoading || !hasNextPage) return;

        isLoading = true;
        currentPage++;
        const loader = document.getElementById('loading-indicator');

        if (loader) loader.style.display = 'block';

        const searchQuery = searchInput ? searchInput.value : '';
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('page', currentPage);

        if (searchQuery) {
            urlParams.set('q', searchQuery);
        }

        fetch(window.location.pathname + `?` + urlParams.toString(), {
            headers: {'X-Requested-With': 'XMLHttpRequest'}
        })
        .then(response => response.json())
        .then(data => {
            const grid = document.getElementById('product-grid');
            if (data.html.includes('Ничего не найдено') || !data.html.trim()) {
                hasNextPage = false;
                if (anchor) anchor.style.display = 'none';
            } else {
                hasNextPage = true;
                if (anchor) anchor.style.display = 'block';
            }

            if (data.html && data.html.trim().length > 0) {
                grid.insertAdjacentHTML('beforeend', data.html);
                const newCards = grid.querySelectorAll('.product-card:not(.show)');
                newCards.forEach((card, i) => {
                    setTimeout(() => card.classList.add('show'), i * 100);
                    if (window.productObserver) window.productObserver.observe(card);
                });
            } else {
                hasNextPage = false;
            }
            hasNextPage = data.has_next;
            isLoading = false;
            if (loader) loader.style.display = 'none';
            if (!hasNextPage) {
                if (scrollObserver && anchor) {
                    scrollObserver.unobserve(anchor);
                    anchor.style.display = 'none';
                }
                console.log('inventory full');
            }
        })
        .catch(err => {
            console.error("Error:", err);
            isLoading = false;
            if (loader) loader.style.display = 'none';
        });
    }
});