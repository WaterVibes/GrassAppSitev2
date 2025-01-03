import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as TWEEN from '@tweenjs/tween.js';

// Global variables
let scene, camera, renderer, labelRenderer, controls;

// Get loading elements
const loadingScreen = document.querySelector('.loading-screen');
const loadingProgress = document.querySelector('.loading-progress');

// Initialize scene and camera
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);

// Set initial camera position from intro marker
const introMarkerData = {
    camera: {
        x: "196.97",
        y: "156.96",
        z: "630.37"
    },
    target: {
        x: "191.44",
        y: "154.81",
        z: "622.32"
    }
};

// Set initial camera position from intro marker
camera.position.set(
    parseFloat(introMarkerData.camera.x),
    parseFloat(introMarkerData.camera.y),
    parseFloat(introMarkerData.camera.z)
);

// Set initial camera target
const initialTarget = new THREE.Vector3(
    parseFloat(introMarkerData.target.x),
    parseFloat(introMarkerData.target.y),
    parseFloat(introMarkerData.target.z)
);
camera.lookAt(initialTarget);

// Add fog to the scene
const fogColor = 0x000000;
const fogNear = 3000;
const fogFar = 6000;
scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

// Initialize renderer
renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: true,
    canvas: document.createElement('canvas')
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Initialize CSS2D renderer for labels
labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'auto';
document.body.appendChild(labelRenderer.domElement);

// Add lights with adjusted settings
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Increased intensity
directionalLight.position.set(2000, 2000, 2000);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096; // Increased shadow resolution
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 10000;
directionalLight.shadow.camera.left = -2000;
directionalLight.shadow.camera.right = 2000;
directionalLight.shadow.camera.top = 2000;
directionalLight.shadow.camera.bottom = -2000;
scene.add(directionalLight);

// Add hemisphere light for better ambient lighting
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
scene.add(hemisphereLight);

// Initialize controls with adjusted constraints
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.enablePan = true;
controls.panSpeed = 0.5;
controls.minDistance = 100;  // Reduced minimum distance
controls.maxDistance = 2000; // Reduced maximum distance
controls.maxPolarAngle = Math.PI / 1.5; // Allow more downward angle
controls.minPolarAngle = 0;   // Allow full upward rotation
controls.target.copy(initialTarget); // Set control target to match camera target

// Function to update fog based on camera position
function updateFog() {
    const distanceToCenter = camera.position.length();
    const maxDistance = controls.maxDistance;
    
    // Adjust fog density based on camera distance
    scene.fog.near = Math.max(fogNear * (distanceToCenter / maxDistance), 500);
    scene.fog.far = Math.min(fogFar * (distanceToCenter / maxDistance), maxDistance);
}

// Function to constrain camera position
function constrainCamera() {
    const maxRadius = 2000;  // Reduced maximum distance from center
    const minHeight = 50;    // Reduced minimum height
    const maxHeight = 1000;  // Reduced maximum height

    // Get current camera position vector
    const pos = camera.position.clone();
    
    // Calculate horizontal distance from center
    const horizontalDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    
    // If outside maximum radius, bring back within bounds
    if (horizontalDist > maxRadius) {
        const angle = Math.atan2(pos.z, pos.x);
        pos.x = maxRadius * Math.cos(angle);
        pos.z = maxRadius * Math.sin(angle);
    }
    
    // Constrain height more strictly
    pos.y = Math.max(minHeight, Math.min(maxHeight, pos.y));
    
    // Apply constrained position
    camera.position.copy(pos);
}

// District markers with their camera positions
const districts = [
    {
        name: 'Baltimore Inner Harbor',
        markerFile: 'marker_baltimore_inner_harbor_subject_subject_marker_1735195982517.json',
        cameraFile: 'marker_baltimore_inner_harbor__1735194251759.json'
    },
    {
        name: 'Canton',
        markerFile: 'marker_canton_subject_subject_marker_1735196858094.json',
        cameraFile: 'marker_canton_camera_camera_marker_1735196801332.json'
    },
    {
        name: 'Fells Point',
        markerFile: 'marker_fells_point_subject__subject_marker_1735197073807.json',
        cameraFile: 'marker_fells_point_camera_camera_marker_1735197031057.json'
    },
    {
        name: 'Federal Hill',
        markerFile: 'marker_federal_hill_subject__subject_marker_1735196627275.json',
        cameraFile: 'marker_federal_hill_marker_camera_marker_1735196516687.json'
    },
    {
        name: 'Mount Vernon',
        markerFile: 'marker_mount_vernon_subject__subject_marker_1735197588128.json',
        cameraFile: 'marker_mount_vernon_camera_camera_marker_1735197513333.json'
    }
];

// Page markers with their camera positions
const pages = [
    {
        name: 'About Us',
        markerFile: 'marker_about_us_subject__subject_marker_1735199597502.json',
        cameraFile: 'marker_about_us_camera_camera_marker_1735199541761.json'
    },
    {
        name: 'Medical Patient',
        markerFile: 'marker_medical_patient_subject_marker_1735199228409.json',
        cameraFile: 'marker_medical_patient_camera_camera_marker_1735199161321.json'
    },
    {
        name: 'Partner With Us',
        markerFile: 'marker_partnership_subject__subject_marker_1735199019215.json',
        cameraFile: 'marker_partnership_camera_marker_1735198971796.json'
    },
    {
        name: 'Delivery Driver',
        markerFile: 'marker_delivery_driver_subject_subject_marker_1735200573413.json',
        cameraFile: 'marker_deliverydrivers_camera_marker_1735200540288.json'
    }
];

// Function to load marker data
async function loadMarkerData(markerFile) {
    try {
        const response = await fetch(`markers/${markerFile}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error loading marker data from ${markerFile}:`, error);
        return null;
    }
}

// Function to create a marker and label
async function createMarker(data, color = 0x00ff00) {
    const markerData = await loadMarkerData(data.markerFile);
    if (!markerData) return;

    // Create marker geometry
    const markerGeometry = new THREE.SphereGeometry(5, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Set position from marker data
    marker.position.set(
        parseFloat(markerData.subject.x),
        parseFloat(markerData.subject.y),
        parseFloat(markerData.subject.z)
    );
    scene.add(marker);

    // Create label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'district-label';
    labelDiv.textContent = data.name;
    labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    labelDiv.style.color = 'white';
    labelDiv.style.padding = '5px 10px';
    labelDiv.style.borderRadius = '5px';
    labelDiv.style.fontSize = '14px';
    
    // Make label clickable
    labelDiv.style.cursor = 'pointer';
    labelDiv.onclick = async () => {
        const cameraData = await loadMarkerData(data.cameraFile);
        if (cameraData) {
            // Create camera position and target vectors
            const targetPos = new THREE.Vector3(
                parseFloat(cameraData.target.x),
                parseFloat(cameraData.target.y),
                parseFloat(cameraData.target.z)
            );
            const cameraPos = new THREE.Vector3(
                parseFloat(cameraData.camera.x),
                parseFloat(cameraData.camera.y),
                parseFloat(cameraData.camera.z)
            );

            // Animate camera movement
            new TWEEN.Tween(camera.position)
                .to(cameraPos, 1000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();

            // Animate controls target
            new TWEEN.Tween(controls.target)
                .to(targetPos, 1000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();
        }
    };

    const label = new CSS2DObject(labelDiv);
    label.position.copy(marker.position);
    label.position.y += 20; // Offset label above marker
    scene.add(label);
}

// Function to create all markers
async function createAllMarkers() {
    // Create district markers (green)
    for (const district of districts) {
        await createMarker(district, 0x00ff00);
    }
    
    // Create page markers (blue)
    for (const page of pages) {
        await createMarker(page, 0x0000ff);
    }
}

try {
    // Initialize loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.158.0/examples/jsm/libs/draco/');
    dracoLoader.preload();
    dracoLoader.setDecoderConfig({ type: 'js' });

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Load the model
    const modelPath = 'models/baltimore_city_optimized_v2.glb';
    console.log('Starting to load model from:', modelPath);
    gltfLoader.load(
        modelPath,
        (gltf) => {
            console.log('Model loaded successfully');
            const model = gltf.scene;
            
            // Adjust model scale if needed
            model.scale.set(1, 1, 1);
            
            // Ensure proper rotation
            model.rotation.x = -Math.PI / 2;
            
            // Enable shadows for the model
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    // Improve material settings
                    if (node.material) {
                        node.material.needsUpdate = true;
                        node.material.side = THREE.DoubleSide;
                    }
                }
            });
            
            scene.add(model);

            // Center and position the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Adjust model position
            model.position.sub(center);
            
            // Set better initial camera position
            const maxDim = Math.max(size.x, size.y, size.z);
            camera.position.set(maxDim * 0.4, maxDim * 0.3, maxDim * 0.4);
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            
            // Update controls based on model size
            controls.target.set(0, 0, 0);
            controls.maxDistance = maxDim;
            controls.minDistance = maxDim * 0.2;
            
            // Update fog based on model size
            scene.fog.near = maxDim * 0.7;
            scene.fog.far = maxDim * 1.2;
            
            createAllMarkers();
            
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

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        TWEEN.update();
        
        // Apply constraints
        constrainCamera();
        updateFog();
        
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
    showError('Failed to initialize the application', error.message);
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