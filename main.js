const { exec } = require("child_process");

// Fungsi untuk menjalankan index.js
const runBot = () => {
  console.log("🔄 Menjalankan bot...");

  // Menjalankan index.js
  const botProcess = exec("node index.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error saat menjalankan bot: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });

  // Menampilkan hitung mundur di terminal
  let countdown = 60; // 60 detik
  const countdownInterval = setInterval(() => {
    console.log(`⏳ Hitung Mundur: ${countdown} detik`);
    countdown -= 1;
    if (countdown <= 0) {
      clearInterval(countdownInterval); // Hentikan hitung mundur
      botProcess.kill(); // Menghentikan bot setelah satu menit
      console.log("⏰ Waktu habis, bot dihentikan dan akan dijalankan ulang.");
      runBot(); // Menjalankan ulang bot
    }
  }, 1000); // Update setiap detik
};

// Jalankan bot pertama kali
runBot();
