import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js';

let camera, scene, renderer;
let video, videoTexture, videoImageContext;

async function init() {
	// Set up Three.js scene
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// Access user's webcam
	video = document.createElement('video');
	video.width = 640; // Set video width (adjust as needed)
	video.height = 480; // Set video height (adjust as needed)
	navigator.mediaDevices.getUserMedia({ video: true })
		.then((stream) => {
			video.srcObject = stream;
			video.play();
		});

	// Create a texture from the webcam feed
	videoImageContext = document.createElement('canvas').getContext('2d');
	videoImageContext.canvas.width = video.width;
	videoImageContext.canvas.height = video.height;
	videoTexture = new THREE.VideoTexture(video);
	const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
	const videoGeometry = new THREE.PlaneGeometry(16, 9); // Plane dimensions (adjust as needed)
	const videoPlane = new THREE.Mesh(videoGeometry, videoMaterial);
	scene.add(videoPlane);

	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const cube = new THREE.Mesh(geometry, material);
	scene.add(cube);

	// Position the camera to see the video plane
	camera.position.z = 10;

	// Run the animation
	animate();
}

function animate() {
	requestAnimationFrame(animate);
	render();
}

function render() {
	// Update the video texture with the current frame from the webcam
	if (video.readyState === video.HAVE_ENOUGH_DATA) {
		videoImageContext.drawImage(video, 0, 0);
		if (videoTexture) {
			videoTexture.needsUpdate = true;
		}
	}

	// Render the scene
	renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

init();