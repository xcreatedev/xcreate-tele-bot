module.exports = (bot) => {
  bot.on("callback_query", (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data === "upload_image") {
      // Mengedit pesan untuk meminta gambar diupload
      bot.editMessageText("📸 *Silakan kirim gambar yang ingin diupload.*", {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔙 Kembali ke Menu Utama",
                callback_data: "menu_utama",
              },
            ],
          ],
        },
      });
    } else if (data === "menu_utama") {
      // Pesan sambutan yang akan dikirim ketika kembali ke menu utama
      const welcomeMessage = `🌟 *Halo ${callbackQuery.from.first_name}! Selamat datang di bot kami.* Pilih menu di bawah ini untuk melanjutkan:\n\n📱 *Aplikasi XCreate* - Dapatkan informasi lebih lanjut.\n📸 *Upload Gambar* - Kirim gambar yang ingin Anda upload.\n📦 *Menu Paket Aplikasi* - Pilih paket aplikasi terbaik untuk Anda.`;

      // Opsi untuk tombol menu utama
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

      // Mengedit pesan sambutan dengan tombol menu utama
      bot.editMessageText(welcomeMessage, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: "Markdown",
        ...options,
      });
    }
  });

  // Menangani pengiriman gambar
  bot.on("photo", (msg) => {
    const chatId = msg.chat.id;
    const photo = msg.photo;

    // Mengambil URL gambar yang diupload (file dengan kualitas tertinggi)
    const fileId = photo[photo.length - 1].file_id;

    bot
      .getFileLink(fileId)
      .then((fileLink) => {
        // Mengirimkan pesan dengan link gambar yang berhasil diupload
        const message = `✨ **Gambar berhasil diupload!** ✨\n\nBerikut adalah **link gambar** yang telah diupload dan disimpan di server Telegram:\n\n📸 [Lihat Gambar di Web](${fileLink})\n\nUntuk menyalin link, tekan dan salin link di atas secara manual.\n\n🔙 Jika Anda ingin kembali ke menu utama, silakan tekan tombol di bawah ini.`;

        bot.sendMessage(chatId, message, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 Kembali ke Menu Utama",
                  callback_data: "menu_utama",
                },
              ],
              [{ text: "📋 Salin Link", url: fileLink }],
            ],
          },
        });
      })
      .catch((error) => {
        console.error("Error getting file link:", error);
        bot.sendMessage(
          chatId,
          "❗ Terjadi kesalahan saat mengupload gambar. Silakan coba lagi."
        );
      });
  });
};
