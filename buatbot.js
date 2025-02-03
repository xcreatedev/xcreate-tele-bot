const {
  addCallbackButton,
  listCallbackButtons,
  editCallbackResponse,
} = require("./callback");
const { createClient } = require("@supabase/supabase-js");
const TelegramBot = require("node-telegram-bot-api");
const tambahPesan = require("./tambah_pesan");

const supabase = createClient(
  "https://gtftsindekhywtwmoeie.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZnRzaW5kZWtoeXd0d21vZWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMjM0MTgsImV4cCI6MjAzOTY5OTQxOH0.t8z_I35XrHpdHz3QzLo05HS4THlOefcPf8rZElC6P9o"
);

// Fungsi untuk menjalankan bot berdasarkan token yang ada di database
const runBots = async () => {
  const { data: bots, error } = await supabase
    .from("user_bots")
    .select("id, token, bot_name, start_message");

  if (error) {
    console.error("Terjadi kesalahan saat mengambil daftar bot:", error);
    return;
  }

  bots.forEach((botData) => {
    const telegramBot = new TelegramBot(botData.token, { polling: true });

    telegramBot.on("message", async (msg) => {
      const chatId = msg.chat.id;

      // Periksa jika perintah yang diterima adalah /start
      if (msg.text.toLowerCase() === "/start") {
        telegramBot.sendMessage(
          chatId,
          botData.start_message || "Selamat datang di Bot kami!"
        );
        return;
      }

      // Periksa apakah ada pesan balasan yang sesuai di database
      const { data: messages, error: msgError } = await supabase
        .from("bot_messages")
        .select("message, callback_data, response, button_name")
        .eq("bot_id", botData.id);

      if (msgError) {
        console.error(
          "Terjadi kesalahan saat mengambil pesan balasan:",
          msgError
        );
        return;
      }

      const message = messages.find(
        (m) => m.message.toLowerCase() === msg.text.toLowerCase()
      );

      if (message) {
        if (message.callback_data) {
          const options = {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: message.button_name,
                    callback_data: message.callback_data,
                  },
                ],
              ],
            },
          };
          telegramBot.sendMessage(chatId, message.response, options);
        } else {
          telegramBot.sendMessage(chatId, message.response);
        }
      } else {
        telegramBot.sendMessage(chatId, "Perintah tidak dikenali.");
      }
    });

    telegramBot.on("callback_query", async (callbackQuery) => {
      const chatId = callbackQuery.message.chat.id;
      const callbackData = callbackQuery.data;

      const { data: callbackButtons, error: cbError } = await supabase
        .from("callback_buttons")
        .select("response")
        .eq("callback_data", callbackData)
        .eq("bot_id", botData.id);

      if (cbError) {
        console.error(
          "Terjadi kesalahan saat mengambil balasan callback:",
          cbError
        );
        return;
      }

      if (callbackButtons.length > 0) {
        telegramBot.sendMessage(chatId, callbackButtons[0].response);
      } else {
        telegramBot.sendMessage(chatId, "Callback tidak dikenali.");
      }
    });
  });
};

// Fungsi untuk membuat bot baru dengan token API
module.exports = (bot) => {
  bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data === "buat_bot") {
      const { data: bots, error } = await supabase
        .from("user_bots")
        .select("*")
        .eq("user_id", chatId);

      if (error) {
        console.error("Terjadi kesalahan dalam mengambil daftar bot:", error);
        bot.sendMessage(
          chatId,
          "Terjadi kesalahan dalam mengambil daftar bot."
        );
        return;
      }

      if (bots.length === 0) {
        bot.sendMessage(
          chatId,
          "Anda belum memiliki bot. Silakan buat bot baru dengan memasukkan token API bot."
        );

        // Tunggu pengguna mengirim token API
        bot.once("message", async (msg) => {
          const tokenApi = msg.text.trim();

          try {
            // Buat instance bot Telegram dengan token yang diberikan
            const newBot = new TelegramBot(tokenApi);

            // Ambil informasi bot menggunakan getMe
            const botInfo = await newBot.getMe();

            const botName = botInfo.username || "Bot Tanpa Nama";

            // Simpan bot ke dalam database
            const { data, error: insertError } = await supabase
              .from("user_bots")
              .insert([
                {
                  user_id: chatId,
                  token: tokenApi,
                  bot_name: botName,
                  start_message: "Selamat datang di bot baru Anda!",
                },
              ]);

            if (insertError) {
              console.error("Gagal menyimpan bot ke database:", insertError);
              return bot.sendMessage(
                chatId,
                "❌ Terjadi kesalahan saat menyimpan bot."
              );
            }

            bot.sendMessage(
              chatId,
              `✅ Bot ${botName} berhasil dibuat dan disimpan!`
            );
            runBots(); // Jalankan semua bot yang terdaftar
          } catch (error) {
            console.error("Gagal mengambil data bot:", error);
            bot.sendMessage(
              chatId,
              "❌ Token tidak valid atau tidak dapat mengambil data bot."
            );
          }
        });
      } else {
        // Mendapatkan nama pengguna
        const currentTime = new Date().toLocaleString(); // Mendapatkan waktu saat ini

        // Pesan pembuka dengan nama pengguna dan waktu
        let botListMessage = `🌟 *berikut adalah daftar bot Anda:* 🌟\n\n`;
        botListMessage += `📅 *Waktu saat ini:* ${currentTime}\n\n`;

        // Menambahkan daftar bot yang dimiliki pengguna
        bots.forEach((botItem, index) => {
          botListMessage += `\n${index + 1}. 🤖 *${
            botItem.bot_name
          } (Status ✅)* \n\n\n\`Tekan tombol dibawah untuk setting bot:\``;
        });

        // Menyiapkan tombol inline untuk setiap bot
        const options = {
          reply_markup: {
            inline_keyboard: [
              ...bots.map((botItem) => [
                {
                  text: `🤖 ${botItem.bot_name}`,
                  callback_data: `bot_${botItem.id}`,
                },
              ]),
            ],
          },
        };

        // Mengirim pesan dengan format yang lebih menarik
        bot.sendMessage(chatId, botListMessage, {
          parse_mode: "Markdown",
          reply_markup: options.reply_markup,
        });
      }
    } else if (data.startsWith("bot_")) {
      const botId = data.split("_")[1];
      const { data: botInfo, error } = await supabase
        .from("user_bots")
        .select("*")
        .eq("id", botId)
        .single();

      if (error || !botInfo) {
        console.error("Bot tidak ditemukan atau error:", error);
        bot.sendMessage(chatId, "❌ *Bot tidak ditemukan.*");
        return;
      }

      // Mengakses chat dari callbackQuery untuk mendapatkan nama pengguna
      const userName = callbackQuery.message.chat.first_name; // Menggunakan `callbackQuery` di sini

      const currentTime = new Date().toLocaleString(); // Mendapatkan waktu saat ini

      // Pesan yang akan ditampilkan
      const commandListMessage = `
    🌟 *Selamat datang ${userName}!* 🌟
    
    ⚙️ *Bot: ${botInfo.bot_name}*  
    
    🕒 *Waktu Saat Ini: ${currentTime}*  
    
    📜 *Perintah Bot:*
    
    1️⃣ /start - Pesan Balasan: 
        *"${botInfo.start_message}"*
    
    Anda dapat menambahkan atau mengubah pesan balasan bot di sini.
    
    🎛️ Pengaturan lainnya dapat diakses melalui tombol di bawah ini.
    `;

      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "➕ Tambah Pesan Balasan 📝",
                callback_data: `add_message_${botInfo.id}`,
              },
            ],
            [
              {
                text: "✏️ Edit Pesan Start ✍️",
                callback_data: `edit_start_message_${botInfo.id}`,
              },
            ],
            [
              {
                text: "⚙️ Pengaturan Callback 🔧",
                callback_data: `setting_callback_${botInfo.id}`,
              },
            ],
            [
              {
                text: "🗑️ Hapus Bot",
                callback_data: `hapus_bot_${botInfo.id}`,
              },
            ],
            [
              {
                text: "🔙 Kembali ke Menu Utama",
                callback_data: "menu",
              },
            ],
          ],
        },
      };

      bot.sendMessage(callbackQuery.message.chat.id, commandListMessage, {
        parse_mode: "Markdown",
        reply_markup: options.reply_markup,
      });

      bot.on("callback_query", async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const callbackData = callbackQuery.data;

        // Memeriksa apakah callback_data adalah untuk menghapus bot
        if (callbackData.startsWith("hapus_bot_")) {
          const botId = callbackData.split("_")[2]; // Mendapatkan botId dari callback_data

          try {
            // Menghapus bot dari database berdasarkan botId
            const { data, error } = await supabase
              .from("user_bots")
              .delete()
              .eq("id", botId);

            if (error) {
              console.error("Gagal menghapus bot:", error);
              return bot.sendMessage(
                chatId,
                "❌ Terjadi kesalahan saat menghapus bot."
              );
            }

            // Menghapus pesan callback untuk konfirmasi
            bot.answerCallbackQuery(callbackQuery.id, {
              text: "Bot berhasil dihapus.",
            });

            // Mengirimkan pesan konfirmasi kepada pengguna
            bot.sendMessage(chatId, `✅ Bot berhasil dihapus!`);
          } catch (err) {
            console.error("Error saat menghapus bot:", err);
            bot.sendMessage(
              chatId,
              "❌ Terjadi kesalahan yang tidak terduga saat menghapus bot."
            );
          }
        }
      });
    } else if (data.startsWith("setting_callback_")) {
      const botId = data.split("_")[2];

      // Menampilkan daftar tombol callback yang sudah ada
      const buttonsMessage = await listCallbackButtons(botId);
      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "➕ Tambah Tombol Callback",
                callback_data: `add_callback_${botId}`,
              },
            ],
            [
              {
                text: "✏️ Edit Balasan Tombol Callback",
                callback_data: `edit_callback_${botId}`,
              },
            ],
            [{ text: "🔙 Kembali", callback_data: `bot_${botId}` }],
          ],
        },
      };
      bot.sendMessage(chatId, buttonsMessage, options);
      // Menangani callback dari tombol "➕ Tambah Pesan Balasan"
      bot.on("callback_query", async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;
        const callbackData = callbackQuery.data;

        // Memeriksa jika callback_data adalah untuk menambahkan pesan balasan
        if (callbackData.startsWith("add_message_")) {
          const botId = callbackData.split("_")[2]; // Mendapatkan botId dari callback_data
          await tambahPesan(bot, chatId, botId); // Memanggil fungsi tambahPesan dengan botId
        }
      });
    } else if (data.startsWith("add_callback_")) {
      const botId = data.split("_")[2];

      // Proses untuk menambahkan tombol callback
      bot.sendMessage(
        chatId,
        "Masukkan nama tombol callback yang akan ditambahkan."
      );

      bot.once("message", async (msg) => {
        const buttonName = msg.text;
        bot.sendMessage(chatId, "Masukkan data callback untuk tombol ini.");

        bot.once("message", async (msg) => {
          const callbackData = msg.text;
          bot.sendMessage(chatId, "Masukkan balasan untuk tombol ini.");

          bot.once("message", async (msg) => {
            const response = msg.text;

            const result = await addCallbackButton(
              botId,
              buttonName,
              callbackData,
              response
            );
            bot.sendMessage(chatId, result);
          });
        });
      });
    } else if (data.startsWith("edit_callback_")) {
      const botId = data.split("_")[2];

      // Menampilkan daftar tombol callback yang sudah ada
      const { data: callbacks, error } = await supabase
        .from("callback_buttons")
        .select("*")
        .eq("bot_id", botId);

      if (error || !callbacks.length) {
        bot.sendMessage(chatId, "Tidak ada tombol callback yang tersedia.");
        return;
      }

      let callbackListMessage = "🚀 *Daftar Tombol Callback:*\n\n";
      callbacks.forEach((callback, index) => {
        callbackListMessage += `${index + 1}. ${callback.button_name} - ${
          callback.response
        }\n`;
      });

      const options = {
        reply_markup: {
          inline_keyboard: callbacks.map((callback) => [
            {
              text: callback.button_name,
              callback_data: `edit_response_${callback.id}`,
            },
          ]),
        },
      };

      bot.sendMessage(chatId, callbackListMessage, options);
    } else if (data.startsWith("edit_response_")) {
      const callbackId = data.split("_")[2];
      bot.sendMessage(chatId, "Masukkan balasan baru untuk tombol ini.");

      bot.once("message", async (msg) => {
        const newResponse = msg.text;

        const result = await editCallbackResponse(callbackId, newResponse);
        bot.sendMessage(chatId, result);
      });
    }
  });

  bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const callbackData = callbackQuery.data;

    // Mengedit pesan start
    if (callbackData.startsWith("edit_start_message_")) {
      const botId = callbackData.split("_")[3];
      await editStartMessage(bot, chatId, botId); // Panggil fungsi edit pesan start
    }

    // Menghapus bot
    if (callbackData.startsWith("hapus_bot_")) {
      const botId = callbackData.split("_")[2];
      await hapusBot(bot, chatId, botId); // Panggil fungsi hapus bot
    }
  });

  const editStartMessage = async (bot, chatId, botId) => {
    try {
      // Pastikan botId adalah integer
      botId = parseInt(botId, 10);

      // Meminta input pesan start baru dari pengguna
      bot.sendMessage(chatId, "Silakan masukkan pesan Start baru:");

      bot.once("message", async (msg) => {
        const newStartMessage = msg.text.trim();

        // Update pesan start di database
        const { error } = await supabase
          .from("user_bots")
          .update({ start_message: newStartMessage })
          .eq("id", botId); // Pastikan botId dikirim sebagai integer

        if (error) {
          console.error("Gagal mengupdate pesan start:", error);
          return bot.sendMessage(
            chatId,
            "❌ Terjadi kesalahan saat memperbarui pesan Start."
          );
        }

        bot.sendMessage(chatId, "✅ Pesan Start berhasil diperbarui!");
      });
    } catch (err) {
      console.error("Error saat edit pesan start:", err);
      bot.sendMessage(chatId, "❌ Terjadi kesalahan yang tidak terduga.");
    }
  };

  // Fungsi untuk menghapus bot
  const hapusBot = async (bot, chatId, botId) => {
    try {
      // Menghapus bot dari database berdasarkan botId
      const { data, error } = await supabase
        .from("user_bots")
        .delete()
        .eq("id", botId);

      if (error) {
        console.error("Gagal menghapus bot:", error);
        return bot.sendMessage(
          chatId,
          "❌ Terjadi kesalahan saat menghapus bot."
        );
      }

      // Mengirimkan pesan konfirmasi kepada pengguna
      bot.sendMessage(chatId, "✅ Bot berhasil dihapus!");
    } catch (err) {
      console.error("Error saat menghapus bot:", err);
      bot.sendMessage(
        chatId,
        "❌ Terjadi kesalahan yang tidak terduga saat menghapus bot."
      );
    }
  };

  // Menjalankan bot dengan client Supabase
  runBots();
};
