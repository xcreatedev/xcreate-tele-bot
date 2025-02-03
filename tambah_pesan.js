const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://gtftsindekhywtwmoeie.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZnRzaW5kZWtoeXd0d21vZWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMjM0MTgsImV4cCI6MjAzOTY5OTQxOH0.t8z_I35XrHpdHz3QzLo05HS4THlOefcPf8rZElC6P9o"
);

// Fungsi untuk menambahkan pesan balasan
const tambahPesan = async (bot, chatId, botId) => {
  // Kirim pilihan jenis pesan dengan tombol
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Pesan Biasa",
            callback_data: "message_regular",
          },
          {
            text: "Pesan dengan Tombol",
            callback_data: "message_button",
          },
        ],
      ],
    },
  };

  bot.sendMessage(chatId, "Silakan pilih jenis pesan:", options);

  bot.once("callback_query", async (callbackQuery) => {
    const { data } = callbackQuery;

    if (data === "message_regular") {
      // Pilih Pesan Biasa
      bot.sendMessage(chatId, "Silakan masukkan perintah (misal: /p):");

      bot.once("message", async (message) => {
        const newMessage = message.text;

        bot.sendMessage(
          chatId,
          "Silakan masukkan pesan balasan (misal: haii):"
        );

        bot.once("message", async (response) => {
          const { error } = await supabase.from("bot_messages").insert([
            {
              bot_id: botId,
              message: newMessage,
              response: response.text,
              type: "regular",
            },
          ]);

          if (error) {
            console.error("Terjadi kesalahan dalam menambahkan pesan:", error);
            bot.sendMessage(
              chatId,
              "Terjadi kesalahan dalam menambahkan pesan."
            );
          } else {
            bot.sendMessage(
              chatId,
              `Pesan baru berhasil ditambahkan: ${newMessage}`
            );
          }
        });
      });
    } else if (data === "message_button") {
      // Pilih Pesan dengan Tombol
      bot.sendMessage(chatId, "Silakan masukkan perintah (misal: /p):");

      bot.once("message", async (message) => {
        const command = message.text;

        bot.sendMessage(
          chatId,
          "Silakan masukkan callback data (misal: balasan_tombol_1):"
        );

        bot.once("message", async (callbackData) => {
          const callback = callbackData.text;

          bot.sendMessage(
            chatId,
            "Silakan masukkan nama tombol (misal: tombol_1):"
          );

          bot.once("message", async (buttonName) => {
            const name = buttonName.text;

            bot.sendMessage(
              chatId,
              "Silakan masukkan pesan balasan untuk tombol ini:"
            );

            bot.once("message", async (callbackResponse) => {
              const { error } = await supabase.from("bot_messages").insert([
                {
                  bot_id: botId,
                  message: command,
                  callback_data: callback,
                  response: callbackResponse.text,
                  button_name: name,
                  type: "callback",
                },
              ]);

              if (error) {
                console.error(
                  "Terjadi kesalahan dalam menambahkan pesan dengan tombol:",
                  error
                );
                bot.sendMessage(
                  chatId,
                  "Terjadi kesalahan dalam menambahkan pesan dengan tombol."
                );
              } else {
                bot.sendMessage(
                  chatId,
                  `Pesan dengan tombol berhasil ditambahkan: ${command}`
                );
              }
            });
          });
        });
      });
    }
  });
};

module.exports = tambahPesan;
