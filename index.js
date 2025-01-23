const TelegramBot = require("node-telegram-bot-api");
const { createClient } = require("@supabase/supabase-js");
const paketapk = require("./paketapk"); // Memanggil file paketapk.js
const uploadImg = require("./uploadimg"); // Memanggil file uploadimg.js
const kategori = require("./kategori"); // Memanggil file kategori.js

// Ganti dengan token yang kamu dapatkan dari BotFather
const token = "7890775366:AAHTxuW-r4k0M_uM7yqELzrOZWa46yuv3iI";

// Membuat bot dengan polling
const bot = new TelegramBot(token, { polling: true });

// Inisialisasi Supabase Client
const supabase = createClient(
  "https://gtftsindekhywtwmoeie.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZnRzaW5kZWtoeXd0d21vZWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMjM0MTgsImV4cCI6MjAzOTY5OTQxOH0.t8z_I35XrHpdHz3QzLo05HS4THlOefcPf8rZElC6P9o"
);

const channelUsername = "@xcreatecode";

// Fungsi untuk memeriksa apakah pengguna telah bergabung dengan channel
const checkIfUserIsMember = (chatId) => {
  return new Promise((resolve, reject) => {
    bot
      .getChatMember(channelUsername, chatId)
      .then((member) => {
        if (member.status === "member" || member.status === "administrator") {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};

// Menyapa pengguna dengan menu utama saat mereka mulai chatting dengan bot
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Cek apakah pengguna sudah bergabung dengan channel
    const isMember = await checkIfUserIsMember(chatId);

    if (!isMember) {
      const message =
        "Silakan bergabung terlebih dahulu dengan channel kami di [XCreate Code](https://t.me/xcreatecode) untuk melanjutkan.";
      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Bergabung dengan Channel",
                url: "https://t.me/xcreatecode",
              },
            ],
          ],
        },
      };
      // Kirim pesan dengan tombol untuk bergabung
      bot.sendMessage(chatId, message, options);
      return;
    }

    // Kirim menu utama setelah bergabung
    const welcomeMessage = `🌟 *Halo ${msg.chat.first_name}! Selamat datang di bot kami.* Pilih menu di bawah ini untuk melanjutkan:\n\n📱 *Aplikasi XCreate* - Dapatkan informasi lebih lanjut.\n📸 *Upload Gambar* - Kirim gambar yang ingin Anda upload.\n📦 *Menu Paket Aplikasi* - Pilih paket aplikasi terbaik untuk Anda.`;

    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛒 XCreate Store", url: "https://xcreate-store.web.app/" }],
          [{ text: "📦 Menu Paket Aplikasi", callback_data: "menu_paket" }],
          [{ text: "📸 Upload Gambar", callback_data: "upload_image" }],
          [{ text: "🔍 Kategori", callback_data: "kategori" }],
        ],
      },
    };

    bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: "Markdown",
      ...options,
    });
  } catch (error) {
    console.error("Error checking channel membership:", error);
    bot.sendMessage(chatId, "Terjadi kesalahan. Coba lagi nanti.");
  }
});

// Menggunakan modul paketapk untuk menangani menu paket aplikasi
paketapk(bot);

// Menangani perintah /start (mengganti perintah menjadi 'start' dan menampilkan menu utama)
bot.setMyCommands([{ command: "start", description: "Mulai menggunakan bot" }]);

// Menggunakan modul uploadImg untuk menangani upload gambar
uploadImg(bot);

// Menggunakan kategori untuk menangani tombol kategori
kategori(bot, supabase);
