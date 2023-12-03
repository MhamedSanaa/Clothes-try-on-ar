const video5 = document.getElementsByClassName("input_video5")[0];

function onResultsPose(results) {
  console.log(results);
}

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
  },
});

pose.onResults(onResultsPose);

const camera = new Camera(video5, {
  onFrame: async () => {
    await pose.send({ image: video5 });
  },
  width: 480,
  height: 480,
});
camera.start();
