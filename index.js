const TelegramBot = require("node-telegram-bot-api");
const { createClient } = require("@supabase/supabase-js");
const paketapk = require("./paketapk"); // Memanggil file paketapk.js
const uploadImg = require("./uploadimg"); // Memanggil file uploadimg.js
const kategori = require("./kategori"); // Memanggil file kategori.js

// Ganti dengan token yang kamu dapatkan dari BotFather
const token = "7890775366:AAEfwfGl05jBcYkBY9hnKXPuz0wXwU47OVA";

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

// Fungsi untuk memformat harga menjadi format Rupiah
const formatRupiah = (harga) => {
  return "Rp " + harga.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Fungsi untuk mengambil detail produk dari Supabase berdasarkan ID produk
const getProductDetails = async (productId) => {
  try {
    const { data, error } = await supabase
      .from("products") // Ganti dengan nama tabel produk Anda
      .select("*")
      .eq("id", productId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching product details:", error);
    return null;
  }
};

// Fungsi untuk menangani pesan /start
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const productIdMatch = match[1].trim(); // Menangkap parameter yang dikirim setelah /start

  try {
    // Jika ada parameter produk yang dikirim (format: ?start=produkid_{id})
    if (productIdMatch.startsWith("produkid_")) {
      const productId = productIdMatch.split("produkid_")[1]; // Mengambil ID produk dari parameter

      // Ambil detail produk berdasarkan ID
      const productDetails = await getProductDetails(productId);

      if (productDetails) {
        const formattedPrice = formatRupiah(productDetails.price); // Format harga produk menjadi Rupiah

        const message = `
          📦 *Detail HTML:*

          🛍️ *Nama Produk:* ${productDetails.name}

          📜 *Deskripsi:* 
          ${productDetails.description}

          💲 *Harga:* ${formattedPrice}

          --------------------------------------

          🎥 *Demo HTML:*
          🎬 demo HTML langsung dengan klik tombol *Demo* di bawah ini.

        `;

        const options = {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🎬 Demo HTML",
                  url: `https://xcreate-store.web.app/?produkid=${productId}`,
                }, // URL Demo produk
              ],
              [
                { text: "💰 Beli HTML", url: "https://t.me/xcodedesain" }, // Tombol Beli ke channel
              ],
            ],
          },
        };

        // Kirim detail produk ke pengguna dengan gambar dan tombol
        bot.sendPhoto(chatId, productDetails.image_url, {
          caption: message,
          parse_mode: "Markdown",
          ...options,
        });
      } else {
        bot.sendMessage(chatId, "Produk tidak ditemukan.");
      }
      return;
    }

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
