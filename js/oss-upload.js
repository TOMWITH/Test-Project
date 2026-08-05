const ResultUpload = (function () {
  function captureResult(statusText) {
    const boardCanvas = document.getElementById("board-canvas");
    const width = 640;
    const height = 780;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#1a1a2e");
    bg.addColorStop(1, "#0f3460");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#daa520";
    ctx.font = "bold 28px 'Segoe UI', 'PingFang SC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("五子棋 - 对局结果", width / 2, 52);

    ctx.fillStyle = "#eeeeee";
    ctx.font = "20px 'Segoe UI', 'PingFang SC', sans-serif";
    ctx.fillText(statusText, width / 2, 92);

    const boardX = (width - boardCanvas.width) / 2;
    ctx.drawImage(boardCanvas, boardX, 120, boardCanvas.width, boardCanvas.height);

    ctx.fillStyle = "#888888";
    ctx.font = "14px 'Segoe UI', 'PingFang SC', sans-serif";
    ctx.fillText(new Date().toLocaleString("zh-CN"), width / 2, height - 24);

    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
  }

  async function uploadViaProxy(blob, result) {
    const response = await fetch(
      `/api/upload?result=${encodeURIComponent(result)}`,
      {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: blob,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `上传失败 (${response.status})`);
    }
    return data.url;
  }

  async function captureAndUpload(result, statusText) {
    const blob = await captureResult(statusText);
    if (!blob) {
      throw new Error("截图生成失败");
    }
    return uploadViaProxy(blob, result);
  }

  return { captureAndUpload };
})();
