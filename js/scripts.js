import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as TWEEN from '@tweenjs/tween.js';

// Global variables
let scene, camera, renderer, labelRenderer, controls;

// Make functions available globally immediately
window.selectDistrict = function(districtName) {
    // This will be replaced with the full implementation once it's defined
    console.log('Placeholder selectDistrict, will be replaced with full implementation');
};

window.showPage = function(pageName) {
    // This will be replaced with the full implementation once it's defined
    console.log('Placeholder showPage, will be replaced with full implementation');
};

// Get loading elements
const loadingScreen = document.querySelector('.loading-screen');
const loadingProgress = document.querySelector('.loading-progress');

// Initialize scene and camera
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);

// Set initial camera position from intro marker
const introMarkerData = {
    camera: {
        x: "0",
        y: "1000",
        z: "1000"
    },
    target: {
        x: "0",
        y: "0",
        z: "0"
    }
};

// Set initial camera position with correct orientation
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

// Add very subtle fog to the scene (only for edges)
const fogColor = 0x000000;
const fogNear = 15000;  // Define fog variables in global scope
const fogFar = 20000;   // Define fog variables in global scope
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

// Add lights for better visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
scene.add(ambientLight);

// Add multiple directional lights for better coverage
const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight1.position.set(1000, 1000, 1000);
scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight2.position.set(-1000, 1000, -1000);
scene.add(directionalLight2);

const directionalLight3 = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight3.position.set(0, 1000, 0);
scene.add(directionalLight3);

// Add more directional lights for comprehensive coverage
const directionalLight4 = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight4.position.set(1000, 1000, -1000);
scene.add(directionalLight4);

const directionalLight5 = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight5.position.set(-1000, 1000, 1000);
scene.add(directionalLight5);

// Remove old point lights and add new ones at strategic positions with increased intensity
const pointLight1 = new THREE.PointLight(0xffffff, 1.2, 2500);
pointLight1.position.set(500, 1000, 500);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 1.2, 2500);
pointLight2.position.set(-500, 1000, -500);
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0xffffff, 1.2, 2500);
pointLight3.position.set(0, 1000, 0);
scene.add(pointLight3);

// Add point lights at corners for better edge lighting
const pointLight4 = new THREE.PointLight(0xffffff, 1.0, 2500);
pointLight4.position.set(500, 1000, -500);
scene.add(pointLight4);

const pointLight5 = new THREE.PointLight(0xffffff, 1.0, 2500);
pointLight5.position.set(-500, 1000, 500);
scene.add(pointLight5);

// Initialize controls with adjusted constraints
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.enablePan = true;
controls.panSpeed = 0.5;
controls.minDistance = 100;
controls.maxDistance = 1500;
controls.maxPolarAngle = Math.PI / 2.1; // Prevent going below horizon
controls.minPolarAngle = Math.PI / 6;   // Keep camera above map
controls.target.copy(initialTarget);

// Function to update fog based on camera position
function updateFog() {
    const distanceToCenter = camera.position.length();
    const maxDistance = controls.maxDistance;
    
    // Much more gradual fog falloff
    scene.fog.near = Math.max(scene.fog.near * (distanceToCenter / maxDistance), 5000);
    scene.fog.far = Math.min(scene.fog.far * (distanceToCenter / maxDistance), maxDistance * 4);
}

// Function to constrain camera position
function constrainCamera() {
    const maxRadius = 1500;
    const minHeight = 100;   // Increased minimum height
    const maxHeight = 800;   // Adjusted maximum height

    const pos = camera.position.clone();
    const horizontalDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    
    if (horizontalDist > maxRadius) {
        const angle = Math.atan2(pos.z, pos.x);
        pos.x = maxRadius * Math.cos(angle);
        pos.z = maxRadius * Math.sin(angle);
    }
    
    // Always keep camera above ground
    pos.y = Math.max(minHeight, Math.min(maxHeight, pos.y));
    
    camera.position.copy(pos);
}

// Define districts and pages arrays at the top level
const districts = [
    {
        name: 'innerHarbor',
        markerFile: 'marker_baltimore_inner_harbor_subject_subject_marker_1735195982517.json',
        cameraFile: 'marker_baltimore_inner_harbor__1735194251759.json'
    },
    {
        name: 'canton',
        markerFile: 'marker_canton_subject_subject_marker_1735196858094.json',
        cameraFile: 'marker_canton_camera_camera_marker_1735196801332.json'
    },
    {
        name: 'fellsPoint',
        markerFile: 'marker_fells_point_subject__subject_marker_1735197073807.json',
        cameraFile: 'marker_fells_point_camera_camera_marker_1735197031057.json'
    },
    {
        name: 'federalHill',
        markerFile: 'marker_federal_hill_subject__subject_marker_1735196627275.json',
        cameraFile: 'marker_federal_hill_marker_camera_marker_1735196516687.json'
    },
    {
        name: 'mountVernon',
        markerFile: 'marker_mount_vernon_subject__subject_marker_1735197588128.json',
        cameraFile: 'marker_mount_vernon_camera_camera_marker_1735197513333.json'
    }
];

const pages = [
    {
        name: 'aboutUs',
        markerFile: 'marker_about_us_subject__subject_marker_1735199597502.json',
        cameraFile: 'marker_about_us_camera_camera_marker_1735199541761.json'
    },
    {
        name: 'medicalPatient',
        markerFile: 'marker_medical_patient_subject_marker_1735199228409.json',
        cameraFile: 'marker_medical_patient_camera_camera_marker_1735199161321.json'
    },
    {
        name: 'partnerWithUs',
        markerFile: 'marker_partnership_subject__subject_marker_1735199019215.json',
        cameraFile: 'marker_partnership_camera_marker_1735198971796.json'
    },
    {
        name: 'deliveryDriver',
        markerFile: 'marker_delivery_driver_subject_subject_marker_1735200573413.json',
        cameraFile: 'marker_deliverydrivers_camera_marker_1735200540288.json'
    }
];

// Function to load marker data
async function loadMarkerData(markerFile) {
    try {
        const response = await fetch(`markers/${markerFile}`);
        const data = await response.json();
        
        // Scale factor to adjust marker positions
        const scale = 0.5;  // Adjust this value to scale marker positions
        
        // Transform coordinates for camera positions
        if (data.camera) {
            const x = parseFloat(data.camera.x) * scale;
            const y = parseFloat(data.camera.z) * scale;  // Use z for height
            const z = parseFloat(data.camera.y) * scale;  // Use y for depth
            data.camera.x = x.toString();
            data.camera.y = y.toString();
            data.camera.z = z.toString();
        }
        
        // Transform coordinates for target positions
        if (data.target) {
            const x = parseFloat(data.target.x) * scale;
            const y = parseFloat(data.target.z) * scale;  // Use z for height
            const z = parseFloat(data.target.y) * scale;  // Use y for depth
            data.target.x = x.toString();
            data.target.y = y.toString();
            data.target.z = z.toString();
        }
        
        // Transform coordinates for subject positions
        if (data.subject) {
            const x = parseFloat(data.subject.x) * scale;
            const y = parseFloat(data.subject.z) * scale;  // Use z for height
            const z = parseFloat(data.subject.y) * scale;  // Use y for depth
            data.subject.x = x.toString();
            data.subject.y = y.toString();
            data.subject.z = z.toString();
        }
        
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

    // Create marker geometry with smaller size
    const markerGeometry = new THREE.SphereGeometry(5, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
        color,
        transparent: true,
        opacity: 0.0  // Make markers invisible
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Set position from marker data
    marker.position.set(
        parseFloat(markerData.subject.x),
        parseFloat(markerData.subject.y),
        parseFloat(markerData.subject.z)
    );
    scene.add(marker);
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

// Function to handle district selection with camera movement
async function selectDistrictImpl(districtName) {
    console.log('Looking for district:', districtName);
    const district = districts.find(d => d.name === districtName);
    if (!district) {
        console.error('District not found:', districtName);
        return;
    }

    try {
        const cameraData = await loadMarkerData(district.cameraFile);
        if (!cameraData) {
            console.error('Camera data not found for district:', districtName);
            return;
        }

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

        // Smooth transition for districts (same as pages)
        new TWEEN.Tween(camera.position)
            .to(cameraPos, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

        new TWEEN.Tween(controls.target)
            .to(targetPos, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

        // Add a slight fade effect during transition
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        overlay.style.pointerEvents = 'none';
        overlay.style.transition = 'opacity 1.5s';
        overlay.style.opacity = '0';
        document.body.appendChild(overlay);

        // Fade in
        setTimeout(() => { overlay.style.opacity = '1'; }, 0);
        // Fade out and remove
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 1500);
        }, 750);

    } catch (error) {
        console.error('Error moving camera to district:', districtName, error);
    }
}

// Add page content data
const pageContent = {
    aboutUs: {
        title: "GrassApp: Delivery for the Culture",
        content: "GrassApp bridges Baltimore's cannabis community with licensed dispensaries, offering a seamless, tech-forward delivery experience. Built on trust, culture, and sustainability, we're more than a service—we're a movement. By prioritizing eco-friendly practices, local collaborations, and transparent operations, GrassApp redefines how cannabis connects people and communities.",
        icon: '🌿'
    },
    medicalPatient: {
        title: "Simplified Access for Medical Patients",
        content: "GrassApp ensures secure and discreet delivery for Maryland's registered medical cannabis patients. Easily browse licensed dispensaries, compare products, and track your delivery in real-time. Not registered yet? Begin your journey through the Maryland Patient Registration Page, and let GrassApp take care of the rest.",
        link: "https://onestop.md.gov/public_profiles/adult-patient-registration-601c0fd9f9d7557af267e1e1",
        icon: '💊'
    },
    partnerWithUs: {
        title: "Empowering Dispensaries, One Delivery at a Time",
        content: "GrassApp partners with local dispensaries to expand their reach and enhance their customer experience. With real-time inventory integration and seamless logistics, we handle the details while you focus on your customers. Ready to grow your business? Let's create something extraordinary together.",
        contact: "contact@thegrassapp.com",
        icon: '🤝'
    },
    deliveryDriver: {
        title: "Drive with GrassApp and Make a Difference",
        content: "Join GrassApp as a certified caregiver and play a vital role in Baltimore's cannabis delivery revolution. With flexible opportunities and the ability to directly impact patient lives, being a GrassApp driver means professionalism, purpose, and pride. Start your journey today by registering as a caregiver through the Maryland Caregiver Registration Page.",
        link: "https://onestop.md.gov/public_profiles/caregiver-registration-601c0fd5f9d7557af267cee1",
        icon: '🚗'
    }
};

// Function to create and animate info card
function showInfoCard(pageName) {
    // Remove any existing info cards
    const existingCard = document.querySelector('.info-card');
    if (existingCard) {
        existingCard.remove();
    }

    const pageInfo = pageContent[pageName];
    if (!pageInfo) return;

    // Create card container
    const card = document.createElement('div');
    card.className = 'info-card';
    card.style.cssText = `
        position: fixed;
        right: -400px;
        top: 50%;
        transform: translateY(-50%);
        width: 350px;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 25px;
        color: white;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
        border: 1px solid rgba(0, 255, 0, 0.1);
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
        opacity: 0;
    `;

    // Create icon
    const icon = document.createElement('div');
    icon.className = 'card-icon';
    icon.textContent = pageInfo.icon;
    icon.style.cssText = `
        font-size: 48px;
        margin-bottom: 15px;
        animation: floatIcon 3s ease-in-out infinite;
    `;

    // Create title
    const title = document.createElement('h2');
    title.textContent = pageInfo.title;
    title.style.cssText = `
        font-size: 24px;
        margin-bottom: 15px;
        color: #00ff00;
        font-weight: bold;
        text-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
    `;

    // Create content
    const content = document.createElement('p');
    content.textContent = pageInfo.content;
    content.style.cssText = `
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 20px;
        color: rgba(255, 255, 255, 0.9);
    `;

    // Add link or contact if available
    if (pageInfo.link || pageInfo.contact) {
        const link = document.createElement('a');
        link.href = pageInfo.link || `mailto:${pageInfo.contact}`;
        link.textContent = pageInfo.link ? 'Register Now' : 'Contact Us';
        link.target = '_blank';
        link.style.cssText = `
            display: inline-block;
            padding: 10px 20px;
            background: linear-gradient(45deg, #00ff00, #00cc00);
            color: black;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            transition: all 0.3s ease;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
        `;
        link.onmouseover = () => {
            link.style.transform = 'scale(1.05)';
            link.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
        };
        link.onmouseout = () => {
            link.style.transform = 'scale(1)';
            link.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
        };
        card.appendChild(link);
    }

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        transition: all 0.3s ease;
    `;
    closeBtn.onclick = () => {
        card.style.right = '-400px';
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 500);
    };

    // Assemble card
    card.appendChild(closeBtn);
    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(content);

    // Add styles for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatIcon {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .info-card {
            animation: glowPulse 2s infinite alternate;
        }
        @keyframes glowPulse {
            0% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.2); }
            100% { box-shadow: 0 0 30px rgba(0, 255, 0, 0.4); }
        }
    `;
    document.head.appendChild(style);

    // Add card to document and animate it in
    document.body.appendChild(card);
    setTimeout(() => {
        card.style.right = '20px';
        card.style.opacity = '1';
    }, 100);
}

// Update showPageImpl to show info card after camera movement
async function showPageImpl(pageName) {
    console.log('Looking for page:', pageName);
    const page = pages.find(p => p.name === pageName);
    if (!page) {
        console.error('Page not found:', pageName);
        return;
    }

    try {
        const cameraData = await loadMarkerData(page.cameraFile);
        if (!cameraData) {
            console.error('Camera data not found for page:', pageName);
            return;
        }

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

        // Smooth transition for pages with transparency
        new TWEEN.Tween(camera.position)
            .to(cameraPos, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

        new TWEEN.Tween(controls.target)
            .to(targetPos, 1500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

        // Add a slight fade effect during transition
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        overlay.style.pointerEvents = 'none';
        overlay.style.transition = 'opacity 1.5s';
        overlay.style.opacity = '0';
        document.body.appendChild(overlay);

        // Fade in
        setTimeout(() => { overlay.style.opacity = '1'; }, 0);
        // Fade out and remove
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                // Show info card after camera movement completes
                showInfoCard(pageName);
            }, 1500);
        }, 750);

    } catch (error) {
        console.error('Error moving camera to page:', pageName, error);
    }
}

// After all the scene setup is complete, replace the placeholder functions with their implementations
document.addEventListener('DOMContentLoaded', () => {
    // Replace placeholder functions with actual implementations
    window.selectDistrict = selectDistrictImpl;
    window.showPage = showPageImpl;

    // Handle district buttons
    const districtButtons = document.querySelectorAll('.districts-container button');
    districtButtons.forEach(button => {
        button.addEventListener('click', () => {
            const buttonText = button.textContent.trim();
            const districtMap = {
                'Inner Harbor': 'innerHarbor',
                'Canton': 'canton',
                'Fells Point': 'fellsPoint',
                'Federal Hill': 'federalHill',
                'Mount Vernon': 'mountVernon'
            };
            const districtName = districtMap[buttonText];
            if (districtName) {
                console.log('Moving to district:', districtName);
                window.selectDistrict(districtName);
            } else {
                console.error('No mapping found for district button:', buttonText);
            }
        });
    });

    // Handle page buttons
    const pageButtons = document.querySelectorAll('.pages-container button');
    pageButtons.forEach(button => {
        button.addEventListener('click', () => {
            const buttonText = button.textContent.trim();
            const pageMap = {
                'About Us': 'aboutUs',
                'Medical Patient': 'medicalPatient',
                'Partner With Us': 'partnerWithUs',
                'Delivery Driver': 'deliveryDriver'
            };
            const pageName = pageMap[buttonText] || buttonText;
            window.showPage(pageName);
        });
    });
});

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
            
            // Set model orientation to match the top-down view
            model.scale.set(1, 1, 1);
            model.rotation.x = 0; // Remove the -Math.PI/2 rotation that was causing the issue
            model.rotation.y = Math.PI; // Rotate 180 degrees around Y axis to face correct direction
            
            // Center the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            
            scene.add(model);

            // Update controls based on model size
            controls.target.set(0, 0, 0);
            controls.maxDistance = 1500;
            controls.minDistance = 100;
            
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