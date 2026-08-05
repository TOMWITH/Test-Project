document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("board-canvas");
  const statusText = document.getElementById("status-text");
  const restartBtn = document.getElementById("restart-btn");
  const uploadStatus = document.getElementById("upload-status");

  function onCellClick(row, col) {
    Game.handlePlayerMove(row, col);
  }

  function onGameUpdate(board, lastMove) {
    Board.setThinking(Game.isAiThinking());

    if (lastMove) {
      Board.setLastMove(lastMove.row, lastMove.col);
      Board.animateStone(lastMove.row, lastMove.col, board, () => {
        Board.render(board);
      });
    } else {
      Board.reset();
      Board.render(board);
    }
  }

  function onStatusChange(text) {
    statusText.textContent = text;
  }

  function setUploadStatus(text, type) {
    uploadStatus.textContent = text;
    uploadStatus.className = "upload-status" + (type ? ` ${type}` : "");
  }

  function onGameEnd(result) {
    const statusMessages = {
      player_win: "恭喜！您赢了！",
      ai_win: "电脑赢了，再试一次！",
      draw: "平局！棋盘已满",
    };

    setTimeout(async () => {
      setUploadStatus("正在上传对局截图…");
      try {
        const url = await ResultUpload.captureAndUpload(
          result,
          statusMessages[result] || "对局结束"
        );
        setUploadStatus("截图已上传至 OSS", "success");
        console.log("OSS URL:", url);
      } catch (err) {
        setUploadStatus(`截图上传失败：${err.message}`, "error");
        console.error("OSS upload error:", err);
      }
    }, 250);
  }

  Board.init(canvas, onCellClick);

  Game.init({
    onUpdate: onGameUpdate,
    onStatusChange: onStatusChange,
    onGameEnd: onGameEnd,
  });

  Board.render(Game.getBoard());

  restartBtn.addEventListener("click", () => {
    Game.reset();
    Board.reset();
    Board.setThinking(false);
    Board.render(Game.getBoard());
    setUploadStatus("");
  });
});
