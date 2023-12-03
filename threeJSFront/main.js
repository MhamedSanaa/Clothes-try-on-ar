import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";

// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

let camera, scene, renderer;
let video, out5, canvasCtx5, videoTexture, videoImageContext;

//Keep the 3D object on a global variable so we can access it later
let object;

async function init() {
	// Set up Three.js scene
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// Access user's webcam
	video = document.createElement("video");
	out5 = document.createElement("canvas");
	canvasCtx5 = out5.getContext("2d");
	function zColor(data) {
		const z = clamp(data.from.z + 0.5, 0, 1);
		return `rgba(0, ${255 * z}, ${255 * (1 - z)}, 1)`;
	  }
	function onResultsPose(results) {
		canvasCtx5.save();
		canvasCtx5.clearRect(0, 0, out5.width, out5.height);
		canvasCtx5.drawImage(results.image, 0, 0, out5.width, out5.height);
		drawConnectors(canvasCtx5, results.poseLandmarks, POSE_CONNECTIONS, {
			color: (data) => {
				const x0 = out5.width * data.from.x;
				const y0 = out5.height * data.from.y;
				const x1 = out5.width * data.to.x;
				const y1 = out5.height * data.to.y;

				const z0 = clamp(data.from.z + 0.5, 0, 1);
				const z1 = clamp(data.to.z + 0.5, 0, 1);

				const gradient = canvasCtx5.createLinearGradient(x0, y0, x1, y1);
				gradient.addColorStop(0, `rgba(0, ${255 * z0}, ${255 * (1 - z0)}, 1)`);
				gradient.addColorStop(1.0, `rgba(0, ${255 * z1}, ${255 * (1 - z1)}, 1)`);
				return gradient;
			},
		});
		drawLandmarks(
			canvasCtx5,
			Object.values(POSE_LANDMARKS_LEFT).map(
				(index) => results.poseLandmarks[index]
			),
			{ color: zColor, fillColor: "#FF0000" }
		);
		drawLandmarks(
			canvasCtx5,
			Object.values(POSE_LANDMARKS_RIGHT).map(
				(index) => results.poseLandmarks[index]
			),
			{ color: zColor, fillColor: "#00FF00" }
		);
		drawLandmarks(
			canvasCtx5,
			Object.values(POSE_LANDMARKS_NEUTRAL).map(
				(index) => results.poseLandmarks[index]
			),
			{ color: zColor, fillColor: "#AAAAAA" }
		);
		canvasCtx5.restore();

		console.log(results);
	}

	const pose = new Pose({
		locateFile: (file) => {
			return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
		},
	});

	pose.onResults(onResultsPose);

	const MediaPipecamera = new Camera(video, {
		onFrame: async () => {
			await pose.send({ image: video });
		},
		width: 480,
		height: 480,
	});
	MediaPipecamera.start();

	// Create a texture from the webcam feed
	videoImageContext = document.createElement("canvas").getContext("2d");
	videoImageContext.canvas.width = video.width;
	videoImageContext.canvas.height = video.height;
	videoTexture = new THREE.VideoTexture(video);
	const videoMaterial = new THREE.MeshBasicMaterial({
		map: videoTexture,
		side: THREE.DoubleSide,
	});
	const videoGeometry = new THREE.PlaneGeometry(16, 9); // Plane dimensions (adjust as needed)
	const videoPlane = new THREE.Mesh(videoGeometry, videoMaterial);
	scene.add(videoPlane);

	const ambientLight = new THREE.AmbientLight(0xffffff, 10); // soft white light
	scene.add(ambientLight);

	const loader = new GLTFLoader();

	loader.load(
		`Assets/artillery_wheel_1_mp/scene.gltf`,
		function (gltf) {
			//If the file is loaded, add it to the scene
			object = gltf.scene;
			object.position.z = 9;
			object.rotation.y = 45;
			scene.add(object);
		},
		function (xhr) {
			//While it is loading, log the progress
			console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
		},
		function (error) {
			//If there is an error, log it
			console.error(error);
		}
	);

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

window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
