import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { convert2Dto3D, getNormalPersonalized } from "./geometry";

/////////////////////////////////////////////////////////////////////////////
///////////////////////////////// MediaPipe /////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

let videoTexture, videoImageContext, canvasTexture, object;

const video5 = document.getElementsByClassName("input_video5")[0];
const out5 = document.getElementsByClassName("output5")[0];
const controlsElement5 = document.getElementsByClassName("control5")[0];

const canvasCtx5 = out5.getContext("2d");

const fpsControl = new FPS();

let poseLandmarks = [];

function zColor(data) {
  const z = clamp(data.from.z + 0.5, 0, 1);
  return `rgba(0, ${255 * z}, ${255 * (1 - z)}, 1)`;
}

function onResultsPose(results) {
  poseLandmarks = results.poseLandmarks;
  document.body.classList.add("loaded");

  fpsControl.tick();

  canvasCtx5.save();
  canvasCtx5.clearRect(0, 0, out5.width, out5.height);
  canvasCtx5.drawImage(results.image, 0, 0, out5.width, out5.height);
  // drawConnectors(canvasCtx5, results.poseLandmarks, POSE_CONNECTIONS, {
  //   color: (data) => {
  //     const x0 = out5.width * data.from.x;
  //     const y0 = out5.height * data.from.y;
  //     const x1 = out5.width * data.to.x;
  //     const y1 = out5.height * data.to.y;

  //     const z0 = clamp(data.from.z + 0.5, 0, 1);
  //     const z1 = clamp(data.to.z + 0.5, 0, 1);

  //     const gradient = canvasCtx5.createLinearGradient(x0, y0, x1, y1);
  //     gradient.addColorStop(0, `rgba(0, ${255 * z0}, ${255 * (1 - z0)}, 1)`);
  //     gradient.addColorStop(1.0, `rgba(0, ${255 * z1}, ${255 * (1 - z1)}, 1)`);
  //     return gradient;
  //   },
  // });
  // drawLandmarks(
  //   canvasCtx5,
  //   Object.values(POSE_LANDMARKS_LEFT).map(
  //     (index) => results.poseLandmarks[index]
  //   ),
  //   { color: zColor, fillColor: "#FF0000" }
  // );
  // drawLandmarks(
  //   canvasCtx5,
  //   Object.values(POSE_LANDMARKS_RIGHT).map(
  //     (index) => results.poseLandmarks[index]
  //   ),
  //   { color: zColor, fillColor: "#00FF00" }
  // );
  // drawLandmarks(
  //   canvasCtx5,
  //   Object.values(POSE_LANDMARKS_NEUTRAL).map(
  //     (index) => results.poseLandmarks[index]
  //   ),
  //   { color: zColor, fillColor: "#AAAAAA" }
  // );
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

///////////////////////////////////////////////////////////////////////
///////////////////////////////// 3JS /////////////////////////////////
///////////////////////////////////////////////////////////////////////

const zPositionObject = 0;
const zPositionCanvas = -5;
const zPositionCamera = 5;

const streamWidth = 16;
const streamHeight = 10;

const loader = new GLTFLoader();

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = zPositionCamera;

//
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
//
const ambientLight = new THREE.AmbientLight(0xffffff, 10); // soft white light
scene.add(ambientLight);

// Create a texture from the canvas feed
canvasTexture = new THREE.CanvasTexture(out5);
const canvasMaterial = new THREE.MeshBasicMaterial({
  map: canvasTexture,
});
const canvasGeometry = new THREE.PlaneGeometry(streamWidth, streamHeight);
const canvasPlane = new THREE.Mesh(canvasGeometry, canvasMaterial);
canvasPlane.position.set(0, 0, zPositionCanvas);

scene.add(canvasPlane);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

console.log(canvasPlane);

const canvasVerticesPosition = canvasPlane.geometry.getAttribute("position");

const vertex = new THREE.Vector3();

for (
  let vertexIndex = 0;
  vertexIndex < canvasVerticesPosition.count;
  vertexIndex++
) {
  vertex.fromBufferAttribute(canvasVerticesPosition, vertexIndex);
  console.log(vertex);

  // do something with vertex
}

// const glassesPivotGeometry = new THREE.SphereGeometry(1, 32, 16);
// const glassesPivotMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
// const glassesPivot = new THREE.Mesh(glassesPivotGeometry, glassesPivotMaterial);
// glassesPivot.position.set(0, 0, 0);
// glassesPivot.scale.set(0.05, 0.05, 0.05);
// scene.add(glassesPivot);


// Load a glTF resource
loader.load(
  // resource URL
  "Assets/fglasses.gltf",
  // called when the resource is loaded
  function (gltf) {
    object = gltf.scene;
    object.scale.set(0.25, 0.25, 0.25);
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

// function handleKeyDown(event) {
//   const keyCode = event.code;

//   if (keyCode === 'ArrowUp') {
//     xPosition += 0.1;
//   } else if (keyCode === 'ArrowDown') {
//     xPosition -= 0.1;
//   }

//   sphereMesh.position.x = xPosition;
// }

// window.addEventListener('keydown', handleKeyDown);

function animate() {
  requestAnimationFrame(animate);

  // console.log(
  //   convert2Dto3D(
  //     poseLandmarks[0].x,
  //     poseLandmarks[0].y,
  //     streamWidth,
  //     streamHeight
  //   )
  // );

  let point1 = convert2Dto3D(
    poseLandmarks[2].x,
    poseLandmarks[2].y,
    streamWidth,
    streamHeight
  );
  let point2 = convert2Dto3D(
    poseLandmarks[5].x,
    poseLandmarks[5].y,
    streamWidth,
    streamHeight
  );

  object.position.x = convert2Dto3D(
    poseLandmarks[0].x,
    poseLandmarks[0].y,
    streamWidth,
    streamHeight
  ).x;
  object.position.y = convert2Dto3D(
    poseLandmarks[0].x,
    poseLandmarks[0].y,
    streamWidth,
    streamHeight
  ).y;
  object.position.z = convert2Dto3D(
    poseLandmarks[0].x,
    poseLandmarks[0].y,
    streamWidth,
    streamHeight
  ).z;

  object.scale.x = (0.2 / 1.5) * point1.distanceTo(point2);
  object.scale.y = (0.2 / 1.5) * point1.distanceTo(point2);
  object.scale.z = (0.2 / 1.5) * point1.distanceTo(point2);
  //////////////////////Rotation

  poseLandmarks[2].z = Math.abs(poseLandmarks[2].z);
  poseLandmarks[5].z = Math.abs(poseLandmarks[2].z);

  // Calculate the direction vector from one eye to the other
  const eyeDirection = new THREE.Vector3().subVectors(
    poseLandmarks[2],
    poseLandmarks[5]
  ).normalize();
  console.log(eyeDirection)

  // Calculate the rotation to align the glasses with the eye direction
  const quaternionEyeDirection = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(1, 0, 0),
    eyeDirection
  );

  // Rotate the glasses
  object.rotation.setFromQuaternion(quaternionEyeDirection);
  object.rotation.x *= -1;
  object.rotation.y *= -1;
  object.rotation.z *= -1;




  // let direction=getNormalPersonalized(poseLandmarks[5],poseLandmarks[0],poseLandmarks[2])
  // console.log(poseLandmarks[0]);
  // var arrowHelper = new THREE.ArrowHelper(
  //   direction.normalize(),
  //   new THREE.Vector3(0, 0, 0),
  //   3,
  //   0xff0000
  // );
  // scene.add(arrowHelper);
  // cube.position.x = -8;
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
