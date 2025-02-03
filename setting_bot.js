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

const bot = new TelegramBot("your_telegram_bot_token", { polling: true });

// Fungsi untuk menjalankan bot berdasarkan token yang ada di database
const runBots = async () => {
  // Ambil semua bot dari database
  const { data: bots, error } = await supabase
    .from("user_bots")
    .select("id, token, bot_name, start_message");

  if (error) {
    console.error("Terjadi kesalahan saat mengambil daftar bot:", error);
    return;
  }

  // Jalankan bot untuk setiap token yang ada di database
  bots.forEach((botData) => {
    const telegramBot = new TelegramBot(botData.token, { polling: true });

    telegramBot.on("message", async (msg) => {
      const chatId = msg.chat.id;

      // Periksa jika perintah yang diterima adalah /start
      if (msg.text.toLowerCase() === "/start") {
        // Kirim pesan balasan sesuai dengan pesan start yang ada di database
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

      // Cari pesan balasan yang sesuai dengan teks yang dikirimkan
      const message = messages.find(
        (m) => m.message.toLowerCase() === msg.text.toLowerCase()
      );

      if (message) {
        // Jika pesan ditemukan dan ada callback_data, kirimkan dengan tombol
        if (message.callback_data) {
          const options = {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: message.button_name, // Nama tombol
                    callback_data: message.callback_data, // Callback data
                  },
                ],
              ],
            },
          };
          telegramBot.sendMessage(chatId, message.response, options);
        } else {
          // Jika pesan tidak memiliki callback_data, kirimkan balasan biasa
          telegramBot.sendMessage(chatId, message.response);
        }
      } else {
        // Jika pesan tidak ditemukan, kirimkan pesan default
        telegramBot.sendMessage(chatId, "Perintah tidak dikenali.");
      }
    });

    telegramBot.on("callback_query", async (callbackQuery) => {
      const chatId = callbackQuery.message.chat.id;
      const callbackData = callbackQuery.data;

      // Ambil balasan untuk callback data di tabel callback_buttons
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
        return;
      }

      let botListMessage = "🚀 *Daftar Bot Anda:*\n\n";
      bots.forEach((botItem, index) => {
        botListMessage += `${index + 1}. ${botItem.bot_name}\n`;
      });

      const options = {
        reply_markup: {
          inline_keyboard: [
            ...bots.map((botItem) => [
              {
                text: botItem.bot_name,
                callback_data: `bot_${botItem.id}`,
              },
            ]),
          ],
        },
      };

      bot.sendMessage(chatId, botListMessage, options);
    } else if (data.startsWith("bot_")) {
      const botId = data.split("_")[1];
      const { data: botInfo, error } = await supabase
        .from("user_bots")
        .select("*")
        .eq("id", botId)
        .single();

      if (error || !botInfo) {
        console.error("Bot tidak ditemukan atau error:", error);
        bot.sendMessage(chatId, "Bot tidak ditemukan.");
        return;
      }

      const commandListMessage = `
        ⚙️ *Bot Commands untuk ${botInfo.bot_name}:*
        
        1️⃣ /start - Pesan Balasan: "${botInfo.start_message}"

        Anda dapat menambahkan atau mengubah pesan balasan bot di sini.
      `;

      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "➕ Tambah Pesan Balasan",
                callback_data: `add_message_${botInfo.id}`,
              },
            ],
            [
              {
                text: "✏️ Edit Pesan Start",
                callback_data: `edit_start_message_${botInfo.id}`,
              },
            ],
            [
              {
                text: "⚙️ Pengaturan Callback",
                callback_data: `setting_callback_${botInfo.id}`,
              },
            ],
            [{ text: "🔙 Kembali", callback_data: "menu" }],
          ],
        },
      };

      bot.sendMessage(chatId, commandListMessage, options);
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

      // Menangani callback dari tombol "➕ Tambah Pesan Balasan"
      bot.on("callback_query", async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;
        const callbackData = callbackQuery.data;

        // Memeriksa jika callback_data adalah untuk menambahkan pesan balasan
        if (callbackData.startsWith("add_message_")) {
          const botId = callbackData.split("_")[2]; // Mendapatkan botId dari callback_data
          await tambahPesan(bot, chatId, botId); // Memanggil fungsi tambahPesan dengan botId
          bot.answerCallbackQuery(callbackQuery.id, {
            text: "Silakan pilih jenis pesan",
          });
        }
      });

      bot.sendMessage(chatId, buttonsMessage, options);
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

  // Fungsi untuk mengedit pesan start
  const editStartMessage = async (bot, chatId, botId) => {
    try {
      // Meminta input pesan start baru dari pengguna
      bot.sendMessage(chatId, "Silakan masukkan pesan Start baru:");

      bot.once("message", async (msg) => {
        const newStartMessage = msg.text.trim();

        // Update pesan start di database
        const { error } = await supabase
          .from("user_bots")
          .update({ start_message: newStartMessage })
          .eq("id", botId);

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

  // Menjalankan bot dengan client Supabase
  runBots();
};  