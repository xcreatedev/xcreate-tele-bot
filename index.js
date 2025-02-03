const TelegramBot = require("node-telegram-bot-api");
const { createClient } = require("@supabase/supabase-js");
const paketapk = require("./paketapk");
const uploadImg = require("./uploadimg");
const kategori = require("./kategori");
const buatBot = require("./buatbot");

const token = "7890775366:AAG5BKoYB0lBRwSepDItuMDFZkbSRm5Qwaw";
const bot = new TelegramBot(token, { polling: true });

const supabase = createClient(
  "https://gtftsindekhywtwmoeie.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZnRzaW5kZWtoeXd0d21vZWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMjM0MTgsImV4cCI6MjAzOTY5OTQxOH0.t8z_I35XrHpdHz3QzLo05HS4THlOefcPf8rZElC6P9o"
);

const channelUsername = "@xcreatecode";

// Fungsi untuk memeriksa apakah pengguna sudah bergabung dengan channel
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
      .from("products")
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
  const productIdMatch = match[1].trim(); // Menangkap parameter produk setelah /start

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
                },
              ],
              [{ text: "💰 Beli HTML", url: "https://t.me/xcodedesain" }],
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
      bot.sendMessage(chatId, message, options);
      return;
    }

    // Kirim sambutan dengan banner dan tombol menu
    const welcomeMessage = `🌟 *Halo ${msg.chat.first_name}!* 🎉

📜 \`Pilih menu berikut untuk melanjutkan:\``;

    const options = {
      reply_markup: {
        inline_keyboard: [[{ text: "📝 Menu", callback_data: "menu" }]],
      },
    };

    // Kirim sambutan dengan banner
    bot.sendPhoto(
      chatId,
      "https://gtftsindekhywtwmoeie.supabase.co/storage/v1/object/public/xcreate//xcl.jpg",
      {
        caption: welcomeMessage,
        parse_mode: "Markdown",
        ...options,
      }
    );
  } catch (error) {
    console.error("Error checking channel membership:", error);
    bot.sendMessage(chatId, "Terjadi kesalahan. Coba lagi nanti.");
  }
});

// Menangani tombol menu
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === "menu") {
    const menuMessage = `
  🌟 *Selamat datang di Menu!* 🌟
  
  📝 *Pilih opsi yang diinginkan dengan menekan tombol di bawah ini:*
  

  1️⃣ *Buat Bot / Setting Bot* 🔧
   \`- Buat balasan otomatis bot\`

  2️⃣ *Store Script* 💻 
  \`- solusi kebutuhan aplikasimu\`

  3️⃣ *Gambar to URL* 🖼️ 
  \`- hosting gambar\`
  

  _Silakan pilih salah satu opsi untuk melanjutkan._
  `;

    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🤖 Buat / Setting Bot 🔧", callback_data: "buat_bot" },
            { text: "🛒 Store Script 💻", callback_data: "kategori" },
          ],
          [{ text: "📸 Gambar To URL 🖼️", callback_data: "upload_image" }],
        ],
      },
    };

    // Kirim pesan dengan format Markdown untuk teks tebal, miring, dan kode
    bot.sendMessage(chatId, menuMessage, { parse_mode: "Markdown", reply_markup: options.reply_markup });
  }
});

// Menangani modul lain
paketapk(bot);
uploadImg(bot);
kategori(bot, supabase);
buatBot(bot);

bot.setMyCommands([{ command: "start", description: "Mulai menggunakan bot" }]);
