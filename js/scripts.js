import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as TWEEN from '@tweenjs/tween.js';

// Get loading elements
const loadingScreen = document.querySelector('.loading-screen');
const loadingProgress = document.querySelector('.loading-progress');

// District coordinates (you'll need to adjust these based on your model)
const districts = [
    { name: 'Central Baltimore', position: { x: 0, y: 1, z: 0 } },
    { name: 'East Baltimore', position: { x: 2, y: 1, z: 0 } },
    { name: 'West Baltimore', position: { x: -2, y: 1, z: 0 } },
    { name: 'South Baltimore', position: { x: 0, y: 1, z: 2 } },
    { name: 'North Baltimore', position: { x: 0, y: 1, z: -2 } }
];

try {
    // Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Initialize renderer with antialias and alpha
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: true,
        canvas: document.createElement('canvas')
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    // Initialize CSS2D renderer for labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    // Function to create district markers
    function createDistrictMarkers() {
        districts.forEach(district => {
            // Create marker geometry
            const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
            const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(district.position.x, district.position.y, district.position.z);
            scene.add(marker);

            // Create label
            const labelDiv = document.createElement('div');
            labelDiv.className = 'district-label';
            labelDiv.textContent = district.name;
            labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            labelDiv.style.color = 'white';
            labelDiv.style.padding = '5px 10px';
            labelDiv.style.borderRadius = '5px';
            labelDiv.style.fontSize = '14px';
            const label = new CSS2DObject(labelDiv);
            label.position.set(district.position.x, district.position.y + 0.2, district.position.z);
            scene.add(label);
        });
    }

    // Initialize loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.158.0/examples/jsm/libs/draco/');
    dracoLoader.preload();
    dracoLoader.setDecoderConfig({ type: 'js' });

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Load the model
    const modelPath = new URL('/GrassAppSitev2/models/baltimore_city_optimized_v2.glb', window.location.origin).href;
    console.log('Starting to load model from:', modelPath);
    gltfLoader.load(
        modelPath,
        (gltf) => {
            console.log('Model loaded successfully');
            scene.add(gltf.scene);
            createDistrictMarkers(); // Add markers after model is loaded
            
            // Center camera on model
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            gltf.scene.position.sub(center);
            
            // Hide loading screen
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        },
        (progress) => {
            if (loadingProgress) {
                const percent = (progress.loaded / progress.total) * 100;
                console.log('Loading progress:', percent + '%');
                loadingProgress.style.width = `${percent}%`;
            }
        },
        (error) => {
            console.error('Detailed error loading model:', {
                message: error.message,
                stack: error.stack,
                type: error.type,
                url: error.target?.responseURL || 'No URL available'
            });
            showError('Failed to load 3D model', error.message);
        }
    );

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        TWEEN.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(onWindowResize, 100);
    });

} catch (error) {
    console.error('Initialization error:', error);
    const errorFallback = document.getElementById('error-fallback');
    if (errorFallback) {
        const errorMessage = errorFallback.querySelector('.error-message');
        const errorDetails = errorFallback.querySelector('.error-details');
        
        if (errorMessage) errorMessage.textContent = 'Failed to initialize the application';
        if (errorDetails) errorDetails.textContent = error.message;
        
        errorFallback.classList.remove('hidden');
    }
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

// Error handling function
function showError(message, details) {
    console.error(message, details);
    const errorFallback = document.getElementById('error-fallback');
    if (errorFallback) {
        const errorMessage = errorFallback.querySelector('.error-message');
        const errorDetails = errorFallback.querySelector('.error-details');
        
        if (errorMessage) errorMessage.textContent = message;
        if (errorDetails) errorDetails.textContent = details;
        
        errorFallback.classList.remove('hidden');
    }
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
} 