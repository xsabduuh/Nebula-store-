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
