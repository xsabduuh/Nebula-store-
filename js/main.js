// ============================================
// js/three-scene.js - المشهد الثلاثي الأبعاد
// ============================================

/**
 * NebulaStore 3D Scene Module
 * يعتمد على THREE.js المحملة مسبقاً عبر CDN
 */
(function () {
    'use strict';

    // انتظار تحميل DOM و THREE.js
    if (typeof THREE === 'undefined') {
        console.error('NebulaStore 3D: THREE.js غير محملة. تأكد من تحميلها قبل هذا الملف.');
        return;
    }

    // ==================== DOM Elements ====================
    const canvas = document.getElementById('three-canvas');
    if (!canvas) {
        console.warn('NebulaStore 3D: #three-canvas غير موجود');
        return;
    }

    // ==================== Scene Setup ====================
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ==================== Starfield Particles ====================
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 2200;
    const starsPositions = new Float32Array(starsCount * 3);
    const starsColors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
        const i3 = i * 3;
        const radius = 4 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starsPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        starsPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starsPositions[i3 + 2] = radius * Math.cos(phi);

        const colorChoice = Math.random();
        if (colorChoice < 0.33) {
            starsColors[i3] = 0.0;
            starsColors[i3 + 1] = 0.94;
            starsColors[i3 + 2] = 1.0;
        } else if (colorChoice < 0.66) {
            starsColors[i3] = 0.7;
            starsColors[i3 + 1] = 0.28;
            starsColors[i3 + 2] = 0.92;
        } else {
            starsColors[i3] = 1.0;
            starsColors[i3 + 1] = 0.18;
            starsColors[i3 + 2] = 0.58;
        }
    }

    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(starsColors, 3));

    const starsMat = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.8,
    });

    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // ==================== Floating Geometric Shapes ====================
    const shapesGroup = new THREE.Group();
    const geometries = [
        new THREE.IcosahedronGeometry(0.5, 1),
        new THREE.TorusKnotGeometry(0.3, 0.1, 80, 16),
        new THREE.OctahedronGeometry(0.4, 0),
        new THREE.TorusGeometry(0.35, 0.1, 32, 60),
        new THREE.DodecahedronGeometry(0.35, 0),
        new THREE.SphereGeometry(0.3, 32, 32),
    ];

    const shapeMeshes = [];

    geometries.forEach((geo, i) => {
        const mat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color().setHSL(i * 0.13 + 0.55, 0.8, 0.55),
            metalness: 0.1,
            roughness: 0.25,
            emissive: new THREE.Color().setHSL(i * 0.13 + 0.55, 0.9, 0.15),
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7,
            wireframe: i % 2 === 0,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 9,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 5 - 1
        );

        mesh.userData = {
            rotSpeed: {
                x: (Math.random() - 0.5) * 0.6,
                y: (Math.random() - 0.5) * 0.6,
                z: (Math.random() - 0.5) * 0.3,
            },
            floatSpeed: 0.3 + Math.random() * 0.7,
            floatAmp: 0.3 + Math.random() * 1.2,
            initialY: mesh.position.y,
            orbitRadius: 0.5 + Math.random() * 3,
            orbitSpeed: 0.1 + Math.random() * 0.4,
            orbitAngle: Math.random() * Math.PI * 2,
        };

        shapesGroup.add(mesh);
        shapeMeshes.push(mesh);
    });

    scene.add(shapesGroup);

    // ==================== Lighting ====================
    const ambientLight = new THREE.AmbientLight(0x222244, 1.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f0ff, 30, 15);
    pointLight1.position.set(4, 2, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xb347ea, 25, 15);
    pointLight2.position.set(-4, -1, 3);
    scene.add(pointLight2);

    // ==================== Mouse / Touch Tracking ====================
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    window.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener(
        'touchmove',
        (e) => {
            if (e.touches.length > 0) {
                mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
                mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
            }
        },
        { passive: true }
    );

    // ==================== Animation Loop ====================
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const dt = Math.min(clock.getDelta(), 0.1);
        const elapsed = performance.now() * 0.001;

        // Smooth mouse follow
        mouse.x += (mouse.targetX - mouse.x) * 3 * dt;
        mouse.y += (mouse.targetY - mouse.y) * 3 * dt;

        // Rotate starfield slowly
        stars.rotation.x += 0.03 * dt;
        stars.rotation.y += 0.05 * dt;
        stars.rotation.z += 0.01 * dt;

        // Camera follows mouse
        camera.position.x += (mouse.x * 1.2 - camera.position.x) * 2 * dt;
        camera.position.y += (mouse.y * 0.8 - camera.position.y) * 2 * dt;
        camera.lookAt(0, 0, 0);

        // Animate shapes
        shapeMeshes.forEach((mesh) => {
            mesh.rotation.x += mesh.userData.rotSpeed.x * dt;
            mesh.rotation.y += mesh.userData.rotSpeed.y * dt;
            mesh.rotation.z += mesh.userData.rotSpeed.z * dt;
            mesh.userData.orbitAngle += mesh.userData.orbitSpeed * dt;
            const oa = mesh.userData.orbitAngle;
            mesh.position.x += Math.cos(oa) * mesh.userData.orbitRadius * 0.3 * dt;
            mesh.position.y =
                mesh.userData.initialY +
                Math.sin(elapsed * mesh.userData.floatSpeed) * mesh.userData.floatAmp;
            mesh.position.z += Math.sin(oa) * mesh.userData.orbitRadius * 0.3 * dt;
        });

        // Dynamic light intensities
        pointLight1.intensity = 28 + Math.sin(elapsed * 1.5) * 6;
        pointLight2.intensity = 23 + Math.cos(elapsed * 1.3) * 5;

        renderer.render(scene, camera);
    }

    animate();

    // ==================== Resize Handler ====================
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ==================== Expose to Global Namespace ====================
    window.NebulaStore = window.NebulaStore || {};
    window.NebulaStore.threeScene = {
        scene,
        camera,
        renderer,
        stars,
        shapesGroup,
        shapeMeshes,
    };

    console.log(
        '%c🌌 NebulaStore 3D Scene %c✓ Initialized %c(Stars: %d, Shapes: %d)',
        'color:#b347ea;font-weight:bold;',
        'color:#4caf50;',
        'color:#a0a0b8;',
        starsCount,
        shapeMeshes.length
    );
})();

// ============================================
// js/main.js - التطبيق الرئيسي والسلة والتفاعلات
// ============================================

/**
 * NebulaStore Main Application
 * يُهيئ السلة، القوائم، الإشعارات، ويربط كل المكونات
 */
(function () {
    'use strict';

    // انتظار تحميل باقي الموديولات
    const ns = window.NebulaStore || {};
    if (!ns.products) {
        console.warn('NebulaStore: انتظار تحميل products.js...');
        // Retry after short delay
        setTimeout(init, 100);
        return;
    }

    function init() {
        // ==================== DOM Elements ====================
        const header = document.getElementById('header');
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.getElementById('navLinks');
        const cartBtn = document.getElementById('cartBtn');
        const cartSidebar = document.getElementById('cartSidebar');
        const cartOverlay = document.getElementById('cartOverlay');
        const cartClose = document.getElementById('cartClose');
        const cartItems = document.getElementById('cartItems');
        const cartCount = document.getElementById('cartCount');
        const cartTotal = document.getElementById('cartTotal');
        const totalAmount = document.getElementById('totalAmount');
        const toast = document.getElementById('toast');

        // ==================== Cart State ====================
        let cart = [];

        try {
            const saved = localStorage.getItem('nebulaCart');
            if (saved) {
                cart = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('NebulaStore: تعذر قراءة السلة من localStorage', e);
            cart = [];
        }

        function saveCart() {
            try {
                localStorage.setItem('nebulaCart', JSON.stringify(cart));
            } catch (e) {
                console.warn('NebulaStore: تعذر حفظ السلة', e);
            }
        }

        /**
         * تحديث واجهة السلة بالكامل
         */
        function updateCartUI() {
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (cartCount) cartCount.textContent = count;

            if (!cartItems) return;

            if (cart.length === 0) {
                cartItems.innerHTML = '<p class="cart-empty">السلة فارغة حالياً 🪐</p>';
                if (cartTotal) cartTotal.style.display = 'none';
            } else {
                cartItems.innerHTML = cart
                    .map(
                        (item, i) => `
                    <div class="cart-item">
                        <span class="cart-item-emoji">${item.emoji}</span>
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <span class="price">${item.price} ⚛️ × ${item.quantity}</span>
                        </div>
                        <button class="cart-remove" data-index="${i}" aria-label="إزالة ${item.name}">✕</button>
                    </div>
                `
                    )
                    .join('');

                const total = cart.reduce(
                    (sum, item) => sum + parseFloat(item.price) * item.quantity,
                    0
                );
                if (totalAmount) totalAmount.textContent = total.toFixed(1) + ' ⚛️';
                if (cartTotal) cartTotal.style.display = 'block';
            }

            // Attach remove listeners
            document.querySelectorAll('.cart-remove').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    if (!isNaN(index) && index >= 0 && index < cart.length) {
                        const removed = cart[index];
                        cart.splice(index, 1);
                        saveCart();
                        updateCartUI();
                        showToast(`🗑️ تمت إزالة "${removed.name}"`);
                    }
                });
            });
        }

        /**
         * إضافة منتج إلى السلة
         */
        function addToCart(product) {
            if (!product || !product.id) return;
            const existing = cart.find((item) => item.id === product.id);
            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            saveCart();
            updateCartUI();
            showToast(`✨ تمت إضافة "${product.name}" إلى السلة`);
        }

        /**
         * إظهار إشعار Toast
         */
        let toastTimeout;
        function showToast(msg) {
            if (!toast) return;
            toast.textContent = msg;
            toast.classList.add('show');
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
        }

        /**
         * فتح / إغلاق السلة
         */
        function toggleCart(force) {
            if (!cartSidebar || !cartOverlay) return;
            const isActive = cartSidebar.classList.contains('active');
            const newState = typeof force === 'boolean' ? force : !isActive;
            cartSidebar.classList.toggle('active', newState);
            cartOverlay.classList.toggle('active', newState);
            document.body.style.overflow = newState ? 'hidden' : '';
            if (cartOverlay) cartOverlay.setAttribute('aria-hidden', !newState);
        }

        // ==================== Event Listeners ====================
        if (cartBtn) cartBtn.addEventListener('click', () => toggleCart(true));
        if (cartClose) cartClose.addEventListener('click', () => toggleCart(false));
        if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));

        // إغلاق السلة بمفتاح Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && cartSidebar && cartSidebar.classList.contains('active')) {
                toggleCart(false);
            }
        });

        // ==================== Header Scroll Effect ====================
        let lastScrollY = 0;
        function onScroll() {
            if (!header) return;
            const scrollY = window.scrollY;
            header.classList.toggle('scrolled', scrollY > 50);
            lastScrollY = scrollY;
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        // Initial check
        onScroll();

        // ==================== Mobile Menu Toggle ====================
        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', () => {
                const isActive = navLinks.classList.toggle('active');
                menuToggle.classList.toggle('active', isActive);
                menuToggle.setAttribute('aria-expanded', isActive);
                document.body.style.overflow = isActive ? 'hidden' : '';
            });

            // إغلاق القائمة عند النقر على رابط
            navLinks.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    menuToggle.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                });
            });
        }

        // ==================== Smooth Scroll for Anchor Links ====================
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // ==================== Expose to Global Namespace ====================
        window.NebulaStore = window.NebulaStore || {};
        window.NebulaStore.cart = cart;
        window.NebulaStore.addToCart = addToCart;
        window.NebulaStore.updateCartUI = updateCartUI;
        window.NebulaStore.showToast = showToast;
        window.NebulaStore.toggleCart = toggleCart;

        // ==================== Render Products ====================
        if (ns.renderProducts) {
            ns.renderProducts();
        }

        // ==================== Initial Cart UI ====================
        updateCartUI();

        // ==================== Console Welcome ====================
        console.log(
            '%c🚀 NebulaStore %cجاهز للعمل %c| %cأي شيء تتخيله... نجده لك',
            'font-size:1.5em;font-weight:bold;color:#00f0ff;',
            'font-size:1.1em;color:#4caf50;',
            'font-size:1em;color:#fff;',
            'font-size:0.95em;color:#b347ea;'
        );
        console.log(
            '%c🪐 Three.js 3D Scene %c| %cGlassmorphism UI %c| %c3D Tilt Cards %c| %cRipple Effects %c| %cParticle Starfield',
            'color:#ff2d95;',
            'color:#fff;',
            'color:#00f0ff;',
            'color:#fff;',
            'color:#b347ea;',
            'color:#fff;',
            'color:#4d7cff;',
            'color:#fff;',
            'color:#ff2d95;'
        );
        console.log(
            `%c📦 المنتجات: ${ns.products.length} %c| %c🛒 السلة: ${cart.reduce((s, i) => s + i.quantity, 0)} عناصر`,
            'color:#00f0ff;',
            'color:#fff;',
            'color:#ff2d95;'
        );
    }

    // ==================== Start ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
