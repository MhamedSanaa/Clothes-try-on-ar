import * as THREE from "three";

export function convert2Dto3D(x, y, w, h) {
  let newX = -(w / 2) + x * w;
  let newY = h / 2 - y * h;
  return new THREE.Vector3(newX, newY, -4.99);
}

export function diffBetweenLandMarks(l1, l2) {
  let newX = l1.x - l2.x;
  let newY = l1.y - l2.y;
  let newZ = l1.z - l2.z;

  return new THREE.Vector3(newX, newY, newZ);
}

export function getNormalPersonalized(l1,l2,l3){
  l2.z=-(l1.z+l3.z)/2;
  l1.z=-l1.z
  l3.z=-l3.z
  // console.log("Left eye : ",l1)
  // console.log("nose : ",l2)
  // console.log("right eye : ",l3)

  let leftEyeNoseVector = diffBetweenLandMarks(
    l1,
    l2
  );
  let rightEyeNoseVector = diffBetweenLandMarks(
    l3,
    l2
  );
  // console.log("result : ",leftEyeNoseVector.cross(rightEyeNoseVector))
  return leftEyeNoseVector.cross(rightEyeNoseVector);

}