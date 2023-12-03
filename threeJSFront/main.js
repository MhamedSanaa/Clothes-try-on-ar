import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";

// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

let camera, scene, renderer;
let video, videoTexture, videoImageContext;

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
  video.width = 640; // Set video width (adjust as needed)
  video.height = 480; // Set video height (adjust as needed)
  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream;
    video.play();
  });

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
