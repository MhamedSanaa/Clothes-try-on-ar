import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let videoTexture, videoImageContext, canvasTexture, object;

let streamWidth = 16;
let streamHeight = 10;

const loader = new GLTFLoader();

/*const video5 = document.createElement("video");
const	out5 = document.createElement("canvas");
const	controlsElement5 = document.createElement("div");*/

const video5 = document.getElementsByClassName("input_video5")[0];
const out5 = document.getElementsByClassName("output5")[0];
const controlsElement5 = document.getElementsByClassName("control5")[0];

const canvasCtx5 = out5.getContext("2d");

const fpsControl = new FPS();

let poseLandmarks = [];

/*const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
  spinner.style.display = 'none';
};*/

function zColor(data) {
  const z = clamp(data.from.z + 0.5, 0, 1);
  return `rgba(0, ${255 * z}, ${255 * (1 - z)}, 1)`;
}

function newCoordination(x, y) {
  var newX = (streamWidth / 2) * x - streamWidth / 2;
  var newY = (streamHeight / 2) * x - streamHeight / 2;
  return { x: newX, y: newY };
}

function onResultsPose(results) {
  poseLandmarks = results.poseLandmarks;
  document.body.classList.add("loaded");
  fpsControl.tick();

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
}

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
  },
});
pose.onResults(onResultsPose);

const MediaPipeCamera = new Camera(video5, {
  onFrame: async () => {
    await pose.send({ image: video5 });
  },
});
MediaPipeCamera.start();

new ControlPanel(controlsElement5, {
  selfieMode: true,
  upperBodyOnly: false,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
})
  .add([
    new StaticText({ title: "MediaPipe Pose" }),
    fpsControl,
    new Toggle({ title: "Selfie Mode", field: "selfieMode" }),
    new Toggle({ title: "Upper-body Only", field: "upperBodyOnly" }),
    new Toggle({ title: "Smooth Landmarks", field: "smoothLandmarks" }),
    new Slider({
      title: "Min Detection Confidence",
      field: "minDetectionConfidence",
      range: [0, 1],
      step: 0.01,
    }),
    new Slider({
      title: "Min Tracking Confidence",
      field: "minTrackingConfidence",
      range: [0, 1],
      step: 0.01,
    }),
  ])
  .on((options) => {
    video5.classList.toggle("selfie", options.selfieMode);
    pose.setOptions(options);
  });
const scene = new THREE.Scene();
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
//
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
//
const ambientLight = new THREE.AmbientLight(0xffffff, 10); // soft white light
scene.add(ambientLight);
// // Create a texture from the webcam feed
// videoTexture = new THREE.VideoTexture(video5);
// const videoMaterial = new THREE.MeshBasicMaterial({
//   map: videoTexture,
// });
// const videoGeometry = new THREE.PlaneGeometry(5, 5); // Plane dimensions (adjust as needed)
// const videoPlane = new THREE.Mesh(videoGeometry, videoMaterial);
// videoPlane.position.x = -4
// scene.add(videoPlane);
// //
// Create a texture from the canvas feed
canvasTexture = new THREE.CanvasTexture(out5);
const canvasMaterial = new THREE.MeshBasicMaterial({
  map: canvasTexture,
});
const canvasGeometry = new THREE.PlaneGeometry(streamWidth, streamHeight);
const canvasPlane = new THREE.Mesh(canvasGeometry, canvasMaterial);
scene.add(canvasPlane);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Load a glTF resource
loader.load(
  // resource URL
  "Assets/fglasses.gltf",
  // called when the resource is loaded
  function (gltf) {
    object = gltf.scene;
    object.scale.set(0.05, 0.05, 0.05);
    //gltf.scene.children[0].children[0].rotation.set()
    scene.add(object);
  },
  // called while loading is progressing
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  // called when loading has errors
  function (error) {
    console.log("An error happened : ", error);
  }
);

camera.position.z = 10;

function calculateDistance(vector1, vector2) {
  // Calculate the distance between two vectors in 3D space
  const dx = vector2.x - vector1.x;
  const dy = vector2.y - vector1.y;
  const dz = vector2.z - vector1.z;

  // Calculate the Euclidean distance using the formula sqrt(dx^2 + dy^2 + dz^2)
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return distance;
}

function convert2DTo3D(obj) {
  const centerX = 0;
  const centerY = 0;

  const z3d = -10; // Z coordinate in 3D

  const x3d = (obj.x - 0.5) * streamWidth * 2 + centerX;
  const y3d = (obj.y - 0.5) * streamHeight * -2 + centerY;

  return { x: x3d, y: y3d, z: z3d };
}

function getMiddlePoint(vector1, vector2) {
  const middleX = (vector1.x + vector2.x) / 2;
  const middleY = (vector1.y + vector2.y) / 2;
  const middleZ = (vector1.z + vector2.z) / 2;

  return { x: middleX, y: middleY, z: middleZ };
}

function animate() {
  requestAnimationFrame(animate);

  let RE = convert2DTo3D(poseLandmarks[2]);

  let LE = convert2DTo3D(poseLandmarks[5]);
  // distance between eyes
  var distanceEyes = calculateDistance(RE, LE);

  let middleEye = getMiddlePoint(LE, RE);

  // console.log(object.position);
  // // console.log(poseLandmarks[0]);
  const x = new THREE.Vector3(
    middleEye.x,
    middleEye.y,
    // poseLandmarks[0].z - 5
    0
  );

  var cordinations = newCoordination(poseLandmarks[0].x, poseLandmarks[0].y);
  console.log("x ", x, " coordinations : ", cordinations);
  // object.position.set(cordinations.x, cordinations.y, poseLandmarks[0].z - 5);
  object.position.set(x.x, x.y, 0);
  object.scale.set(0.3, 0.3, 0.3);
  // Update video texture
  if (videoTexture) {
    videoTexture.needsUpdate = true;
  }

  // Update canvas texture
  if (canvasTexture) {
    canvasTexture.needsUpdate = true;
  }
  renderer.render(scene, camera);
}
animate();
