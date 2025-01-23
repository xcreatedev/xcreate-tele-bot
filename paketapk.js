// Import bot dari file utama
const TelegramBot = require("node-telegram-bot-api");

// Fungsi untuk mengelola menu paket aplikasi
module.exports = (bot) => {
  bot.on("callback_query", (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if (data === "menu_paket") {
      bot.editMessageText("✨ *Pilih paket aplikasi yang tersedia:* ✨", {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📦 Paket 1 - Aplikasi Premium",
                callback_data: "paket_1",
              },
            ],
            [
              {
                text: "🔙 Kembali ke Menu Utama",
                callback_data: "back_to_menu",
              },
            ],
          ],
        },
      });
    } else if (data === "paket_1") {
      // Kirim gambar dan detail paket 1
      const paket1Message = `
        🎉 **Detail Paket 1**:

        🔥 *Tampilan Full APK* 🔥

        **Script yang didapat:**
        - 🏠 Home
        - 📜 Riwayat Transaksi OpenAPI
        - 🛍️ List Produk OpenAPI
        - 📊 Rekap
        - 💳 Catatan Hutang
        - 🛡️ Verifikasi Identitas
        - 💵 Menu Kasir
        - 👤 Profil

        🔥 *Harga 250k*

        📌 *Note*: Sistem yang menggunakan hosting tidak dikenakan biaya bulanan dan bisa dipasang di hosting sendiri.

        🌟 *Demo Langsung*: Klik tombol di bawah ini untuk memulai demo langsung aplikasi.

        📞 Kustom tampilan lainnya hubungi @xcodedesain`;

      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🎬 Demo Langsung",
                url: "https://t.me/xcreatestore_bot/paket_1", // Link ke demo langsung
              },
            ],
          ],
        },
      };

      bot.sendPhoto(
        chatId,
        "https://gtftsindekhywtwmoeie.supabase.co/storage/v1/object/public/product-images/public/1729410498453.jpg",
        {
          caption: paket1Message,
          reply_markup: options.reply_markup,
        }
      );
    } else if (data === "back_to_menu") {
      // Kirim menu utama setelah bergabung
      const welcomeMessage = `🌟 *Halo ${callbackQuery.message.chat.first_name}! Selamat datang di bot kami.* Pilih menu di bawah ini untuk melanjutkan:\n\n📱 *Aplikasi XCreate* - Dapatkan informasi lebih lanjut.\n📸 *Upload Gambar* - Kirim gambar yang ingin Anda upload.\n📦 *Menu Paket Aplikasi* - Pilih paket aplikasi terbaik untuk Anda.`;

      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🛒 XCreate Store",
                url: "https://xcreate-store.web.app/",
              },
            ],
            [{ text: "📦 Menu Paket Aplikasi", callback_data: "menu_paket" }],
            [{ text: "📸 Upload Gambar", callback_data: "upload_image" }],
            [{ text: "🔍 Kategori", callback_data: "kategori" }],
          ],
        },
      };

      bot.editMessageText(welcomeMessage, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: options.reply_markup,
      });
    }
  });
};
