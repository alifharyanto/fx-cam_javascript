    const video = document.getElementById("webcam");
    const canvas = document.getElementById("overlay");
    const ctx = canvas.getContext("2d");
    const detectedText = document.getElementById("detectedText");
    const infoBox = document.getElementById("infoBox");
    const nameEl = document.getElementById("name");
    const ageEl = document.getElementById("age");

    let model;

    async function setupCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Browser kamu tidak support webcam");
        return;
      }
      // Request user-facing camera without mirroring
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } }, // environment camera (back)
        audio: false,
      }).catch(async () => {
        // fallback to user camera if environment not available
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
      });
      video.srcObject = stream;

      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          resolve(video);
        };
      });
    }

    async function loadModel() {
      model = await blazeface.load();
    }

    function resizeCanvas() {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.style.width = video.clientWidth + "px";
      canvas.style.height = video.clientHeight + "px";
    }

    function drawFaceBox(face) {
      const start = face.topLeft;
      const end = face.bottomRight;
      let width = end[0] - start[0];
      let height = end[1] - start[1];

      // frame box ai
      const size = Math.max(width, height);

      // kordinat box
      const centerX = start[0] + width / 2;
      const centerY = start[1] + height / 2;
      const boxX = centerX - size / 2;
      const boxY = centerY - size / 2;

      ctx.lineWidth = 3;
      ctx.strokeStyle = "#FFFFFF";
      ctx.fillStyle = "transparent";
      ctx.beginPath();
      ctx.rect(boxX, boxY, size, size);
      ctx.stroke();

      return { x: boxX, y: boxY, size };
    }

    function showInfoBox(x, y, size) {
      infoBox.style.display = "block";
      // info name age di bawah box
      const padding = 6;
      const boxWidth = infoBox.offsetWidth;
      const boxHeight = infoBox.offsetHeight;

      let left = x + size - boxWidth;
      let top = y + size + padding;

      // Clamp so it doesn't go outside viewport horizontally
      if (left < 0) left = 0;
      if (left + boxWidth > window.innerWidth) left = window.innerWidth - boxWidth - padding;

      // Clamp vertically so it doesn't go below viewport
      if (top + boxHeight > window.innerHeight) {
        // If no space below, place above the box
        top = y - boxHeight - padding;
        if (top < 0) top = 0;
      }

      infoBox.style.left = left + "px";
      infoBox.style.top = top + "px";
    }

    function hideInfoBox() {
      infoBox.style.display = "none";
    }

    async function detectFaces() {
      if (!model) return;

      const returnTensors = false;
      const predictions = await model.estimateFaces(video, returnTensors);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (predictions.length > 0) {
        const box = drawFaceBox(predictions[0]);
        showInfoBox(box.x, box.y, box.size);
        detectedText.style.display = "block";
      } else {
        hideInfoBox();
        detectedText.style.display = "none";
      }
      requestAnimationFrame(detectFaces);
    }

    async function main() {
      await setupCamera();
      video.play();
      resizeCanvas();
      await loadModel();
      detectFaces();
    }

    window.addEventListener("resize", () => {
      resizeCanvas();
    });

    main();
