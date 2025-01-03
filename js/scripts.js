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

// Update fog settings for better immersion
const fogColor = 0x000000;
const fogNear = 800;  // Start fog closer
const fogFar = 1500;
scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

// Enhanced fog update function for better immersion
function updateFog() {
    const distanceFromCenter = Math.sqrt(
        camera.position.x * camera.position.x + 
        camera.position.z * camera.position.z
    );
    
    // Calculate height-based fog
    const heightFactor = Math.max(0, Math.min(1, camera.position.y / 1000));
    
    // Calculate distance-based fog
    const distanceFactor = Math.max(0, Math.min(1, distanceFromCenter / 1000));
    
    // Combine both factors for dynamic fog
    const fogFactor = Math.max(heightFactor, distanceFactor);
    
    // Apply fog based on combined factors
    if (fogFactor > 0.3) {  // Start fog effect earlier
        const intensity = (fogFactor - 0.3) / 0.7;  // Normalize to 0-1 range
        scene.fog.near = 800 - (intensity * 400);   // Fog starts closer as factors increase
        scene.fog.far = 1500 - (intensity * 500);   // Fog ends sooner as factors increase
    } else {
        scene.fog.near = 1000;  // Default fog distance when close to center and low
        scene.fog.far = 2000;
    }
}

// Initialize renderer
renderer = new THREE.WebGLRenderer({ 
    antialias: window.devicePixelRatio === 1,  // Only use antialiasing on non-mobile
    alpha: true,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: true,
    canvas: document.createElement('canvas')
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.shadowMap.enabled = false;  // Disable shadows for better performance
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

// Function to check if device is mobile
function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Function to constrain camera position
function constrainCamera() {
    const maxRadius = 1200;  // Reduced from 1500 to keep within fog boundaries
    const minHeight = 200;   // Increased minimum height to prevent clipping
    const maxHeight = 1000;  // Increased maximum height for better overview

    const pos = camera.position.clone();
    const horizontalDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    
    // Constrain horizontal movement
    if (horizontalDist > maxRadius) {
        const angle = Math.atan2(pos.z, pos.x);
        pos.x = maxRadius * Math.cos(angle);
        pos.z = maxRadius * Math.sin(angle);
    }
    
    // Constrain vertical movement with smooth transition near boundaries
    if (pos.y < minHeight + 100) {
        pos.y = minHeight + (pos.y - minHeight) * 0.5;  // Smooth transition near ground
    } else if (pos.y > maxHeight - 100) {
        pos.y = maxHeight - (maxHeight - pos.y) * 0.5;  // Smooth transition near ceiling
    }
    
    // Additional constraints for diagonal movement
    const minAngle = Math.PI / 6;  // 30 degrees
    const maxAngle = Math.PI / 2.1; // About 85 degrees
    
    const currentAngle = Math.atan2(pos.y, horizontalDist);
    if (currentAngle < minAngle) {
        const targetY = horizontalDist * Math.tan(minAngle);
        pos.y = pos.y * 0.8 + targetY * 0.2;  // Smooth transition
    } else if (currentAngle > maxAngle) {
        const targetY = horizontalDist * Math.tan(maxAngle);
        pos.y = pos.y * 0.8 + targetY * 0.2;  // Smooth transition
    }
    
    camera.position.copy(pos);
}

// Initialize controls with tighter constraints
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.enablePan = true;
controls.panSpeed = isMobileDevice() ? 0.3 : 0.5;
controls.minDistance = isMobileDevice() ? 200 : 300;  // Increased minimum distance
controls.maxDistance = isMobileDevice() ? 1000 : 1200;  // Reduced maximum distance
controls.maxPolarAngle = Math.PI / 2.1;
controls.minPolarAngle = Math.PI / 6;
controls.target.copy(initialTarget);

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

// Add page content data with multiple cards per page
const pageContent = {
    aboutUs: {
        cards: [
            {
                title: "Who We Are",
                content: "GrassApp is more than a delivery service; we're a bridge connecting people to trusted, local dispensaries in a way that's safe, seamless, and culturally relevant.\nFounded in Baltimore, our mission is rooted in uplifting communities, providing access to cannabis responsibly, and celebrating the unique spirit of the people we serve.\nWhether you're a medical cannabis patient or a business partner, GrassApp delivers more than products—we deliver trust.",
                icon: '🌿'
            },
            {
                title: "Our Commitment to the Community",
                content: "GrassApp isn't just about convenience; it's about connection.\nSupporting local businesses and artists to ensure the community thrives.\nCollaborating with dispensaries to provide personalized service.\nInnovating for sustainability by prioritizing eco-friendly practices, such as plantable packaging and waste reduction initiatives.",
                icon: '🤝'
            },
            {
                title: "Why Choose GrassApp?",
                content: "Fully digital and easy-to-use platform designed for today's tech-savvy customers.\nCommitted to transparency, efficiency, and fostering relationships with the people and businesses that make Baltimore special.\nInspired by the culture and dedicated to setting a new standard for cannabis delivery.",
                icon: '✨'
            }
        ]
    },
    medicalPatient: {
        cards: [
            {
                title: "How GrassApp Supports Patients",
                content: "We understand the importance of reliable access to your medical cannabis products. GrassApp is here to simplify the process, ensuring every delivery is discreet, secure, and timely.\nBrowse licensed dispensaries, compare product options, and track your delivery in real-time—all from the comfort of your home.",
                icon: '💊'
            },
            {
                title: "Steps to Register as a Patient",
                content: "Becoming a registered medical cannabis patient in Maryland is simple. Follow these steps to get started:\nVisit the Maryland Patient Registration Page.\nProvide your personal information and upload the required documentation.\nOnce approved, browse GrassApp to find dispensaries tailored to your medical needs.",
                icon: '📝',
                link: "https://onestop.md.gov/public_profiles/adult-patient-registration-601c0fd9f9d7557af267e1e1"
            },
            {
                title: "Your Privacy Matters",
                content: "GrassApp is committed to protecting your medical and personal information. We comply with HIPAA regulations and use advanced encryption to keep your data secure.",
                icon: '🔒'
            }
        ]
    },
    partnerWithUs: {
        cards: [
            {
                title: "Why Partner with GrassApp?",
                content: "Partnering with GrassApp connects your dispensary with a growing network of medical cannabis patients seeking reliable delivery services.\nOur platform integrates seamlessly with your existing operations, allowing you to focus on serving your customers while we handle the logistics.",
                icon: '🤝'
            },
            {
                title: "How We Work Together",
                content: "GrassApp uses live API integration to keep your inventory updated in real time, ensuring accurate product availability for customers.\nOur delivery system is designed to reflect your dispensary's professionalism, offering a service that mirrors the quality you provide in-store.",
                icon: '⚡'
            },
            {
                title: "Steps to Join",
                content: "Becoming a GrassApp partner is straightforward:\nReach out to our team to discuss your dispensary's unique needs.\nSet up API keys and configure real-time inventory tracking.\nSit back as GrassApp connects you with a wider audience of patients and customers.",
                icon: '🚀',
                contact: "contact@thegrassapp.com"
            }
        ]
    },
    deliveryDriver: {
        cards: [
            {
                title: "Be Part of Something Bigger",
                content: "Driving with GrassApp isn't just about making deliveries; it's about being part of a movement to redefine cannabis delivery in Baltimore.\nAs a caregiver-certified driver, you'll play a vital role in ensuring patients and customers get their orders on time and with care.",
                icon: '🚗'
            },
            {
                title: "What You Need to Get Started",
                content: "To join the GrassApp team, you'll need:\nMMCC Caregiver Certification: Learn how to register at the Maryland Caregiver Registration Page.\nA reliable vehicle for deliveries.\nA dedication to professionalism and excellent customer service.",
                icon: '📋',
                link: "https://onestop.md.gov/public_profiles/caregiver-registration-601c0fd5f9d7557af267cee1"
            },
            {
                title: "Your Journey Begins Here",
                content: "Joining GrassApp means flexible opportunities, access to a growing community of cannabis professionals, and the chance to make a difference in patients' lives.\nReady to start? Let GrassApp guide you every step of the way, from registration to your first delivery.",
                icon: '🌟'
            }
        ]
    }
};

// Update showInfoCard function to handle multiple cards
let currentCardIndex = 0;

function showInfoCard(pageName) {
    const pageInfo = pageContent[pageName];
    if (!pageInfo || !pageInfo.cards || !pageInfo.cards.length) return;

    // Remove any existing info cards first
    const existingCard = document.querySelector('.info-card');
    if (existingCard) {
        existingCard.remove();
    }

    const cardInfo = pageInfo.cards[currentCardIndex];
    const isMobile = isMobileDevice();  // Ensure we use isMobile consistently

    // Create card container with mobile-responsive styles
    const card = document.createElement('div');
    card.className = 'info-card';
    
    card.style.cssText = `
        position: fixed;
        ${isMobile ? 'bottom: -100%;' : 'right: -400px;'}
        ${isMobile ? 'left: 5%;' : 'top: 50%;'}
        width: ${isMobile ? '90%' : '350px'};
        ${isMobile ? '' : 'transform: translateY(-50%);'}
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        border-radius: ${isMobile ? '20px 20px 0 0' : '20px'};
        padding: ${isMobile ? '20px' : '25px'};
        color: white;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        border: 1px solid rgba(0, 255, 0, 0.2);
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
        opacity: 0;
        max-height: ${isMobile ? '80vh' : 'none'};
        overflow-y: ${isMobile ? 'auto' : 'visible'};
        -webkit-overflow-scrolling: touch;
    `;

    // Create icon with adjusted size for mobile
    const icon = document.createElement('div');
    icon.className = 'card-icon';
    icon.textContent = cardInfo.icon;
    icon.style.cssText = `
        font-size: ${isMobile ? '42px' : '48px'};
        margin-bottom: ${isMobile ? '15px' : '20px'};
        animation: floatIcon 3s ease-in-out infinite;
        text-align: center;
    `;

    // Create title with adjusted size for mobile
    const title = document.createElement('h2');
    title.textContent = cardInfo.title;
    title.style.cssText = `
        font-size: ${isMobile ? '22px' : '24px'};
        margin-bottom: ${isMobile ? '15px' : '20px'};
        color: #00ff00;
        font-weight: bold;
        text-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        text-align: center;
    `;

    // Create content with adjusted size for mobile
    const content = document.createElement('p');
    content.textContent = cardInfo.content;
    content.style.cssText = `
        font-size: ${isMobile ? '16px' : '16px'};
        line-height: 1.8;
        margin-bottom: ${isMobile ? '20px' : '25px'};
        color: rgba(255, 255, 255, 0.95);
        text-align: justify;
        padding: 0 10px;
    `;

    // Add link or contact if available with mobile-optimized styles
    if (cardInfo.link || cardInfo.contact) {
        const link = document.createElement('a');
        link.href = cardInfo.link || `mailto:${cardInfo.contact}`;
        link.textContent = cardInfo.link ? 'Register Now' : 'Contact Us';
        link.target = '_blank';
        link.style.cssText = `
            display: block;  // Changed to block for full width on mobile
            width: ${isMobile ? '80%' : 'auto'};  // Control width on mobile
            margin: ${isMobile ? '0 auto' : '0'};  // Center on mobile
            padding: ${isMobile ? '12px 0' : '10px 20px'};  // Adjusted padding
            background: linear-gradient(45deg, #00ff00, #00cc00);
            color: black;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            text-align: center;
            font-size: ${isMobile ? '16px' : '16px'};  // Increased from 14px
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

    // Add close button with mobile-optimized position
    const closeBtn = document.createElement('button');
    closeBtn.textContent = isMobile ? 'Close' : '×';
    closeBtn.style.cssText = `
        position: absolute;
        ${isMobile ? 'bottom: 15px;' : 'top: 15px;'}  // Increased from 10px
        ${isMobile ? 'left: 50%;' : 'right: 15px;'}
        ${isMobile ? 'transform: translateX(-50%);' : ''}
        background: ${isMobile ? 'linear-gradient(45deg, #00ff00, #00cc00)' : 'none'};
        border: none;
        color: ${isMobile ? 'black' : 'white'};
        font-size: ${isMobile ? '16px' : '24px'};
        cursor: pointer;
        padding: ${isMobile ? '12px 30px' : '0'};  // Increased padding
        ${isMobile ? 'width: 140px;' : 'width: 30px; height: 30px;'}  // Increased width
        border-radius: ${isMobile ? '25px' : '50%'};
        transition: all 0.3s ease;
        font-weight: bold;
    `;
    closeBtn.onclick = () => {
        if (isMobile) {
            card.style.bottom = '-100%';
        } else {
            card.style.right = '-400px';
        }
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
        if (isMobile) {
            card.style.bottom = '0';
        } else {
            card.style.right = '20px';
        }
        card.style.opacity = '1';
    }, 100);

    // Add navigation dots for multiple cards
    const dotsContainer = document.createElement('div');
    dotsContainer.style.cssText = `
        position: absolute;
        bottom: ${isMobile ? '60px' : '20px'};
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        justify-content: center;
    `;

    pageInfo.cards.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${index === currentCardIndex ? '#00ff00' : 'rgba(0, 255, 0, 0.3)'};
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        dot.onclick = () => {
            currentCardIndex = index;
            showInfoCard(pageName);
        };
        dotsContainer.appendChild(dot);
    });

    card.appendChild(dotsContainer);

    // Add swipe navigation for mobile
    let touchStartX = 0;
    card.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });

    card.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > 50) {  // Minimum swipe distance
            if (diff > 0 && currentCardIndex < pageInfo.cards.length - 1) {
                // Swipe left
                currentCardIndex++;
                showInfoCard(pageName);
            } else if (diff < 0 && currentCardIndex > 0) {
                // Swipe right
                currentCardIndex--;
                showInfoCard(pageName);
            }
        }
    });

    // Reset card index when changing pages
    if (card.dataset.pageName !== pageName) {
        currentCardIndex = 0;
        card.dataset.pageName = pageName;
    }
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

    // Handle window resize with mobile optimizations
    function onWindowResize() {
        const isMobile = isMobileDevice();
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Update controls for mobile
        controls.panSpeed = isMobile ? 0.3 : 0.5;
        controls.minDistance = isMobile ? 50 : 100;
        controls.maxDistance = isMobile ? 1000 : 1500;

        // Adjust any existing info cards
        const existingCard = document.querySelector('.info-card');
        if (existingCard) {
            if (isMobile) {
                existingCard.style.right = '';
                existingCard.style.top = '';
                existingCard.style.transform = 'none';
                existingCard.style.width = '100%';
                existingCard.style.bottom = '0';
                existingCard.style.borderRadius = '20px 20px 0 0';
            } else {
                existingCard.style.bottom = '';
                existingCard.style.right = '20px';
                existingCard.style.top = '50%';
                existingCard.style.transform = 'translateY(-50%)';
                existingCard.style.width = '350px';
                existingCard.style.borderRadius = '20px';
            }
        }
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