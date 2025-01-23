module.exports = (bot, supabase) => {
  bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if (data === "kategori") {
      try {
        // Mengambil daftar kategori unik dari Supabase
        const { data: products, error } = await supabase
          .from("products")
          .select("id, category, price")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        // Mengambil kategori unik
        const categories = [
          ...new Set(products.map((product) => product.category)),
        ];

        if (categories.length > 0) {
          let keyboard = categories.map((category) => [
            {
              text: `📦 ${category}`,
              callback_data: `category_${category}`,
            },
          ]);

          const message =
            "📦 *Berikut adalah daftar kategori kami:*\n\nPilih kategori untuk melihat lebih detail.";

          // Tambahkan tombol "Kembali ke Menu Utama" di atas kategori
          const options = {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔙 Kembali ke Menu Utama",
                    callback_data: "menu_utama",
                  },
                ],
                ...keyboard,
              ],
            },
          };

          // Edit pesan sebelumnya menjadi daftar kategori dengan tombol kembali
          bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            ...options,
          });
        } else {
          bot.sendMessage(chatId, "❗ Tidak ada kategori yang tersedia.");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        bot.sendMessage(
          chatId,
          "❗ Terjadi kesalahan saat mengambil kategori."
        );
      }
    }

    // Menangani pilihan kategori
    if (data.startsWith("category_")) {
      const category = data.split("_")[1];
      try {
        const { data: products, error } = await supabase
          .from("products")
          .select("*")
          .eq("category", category);

        if (error) {
          throw error;
        }

        if (products.length > 0) {
          let keyboard = products.map((product) => [
            {
              text: `📦 ${product.name} - ${new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(product.price)}`,
              callback_data: `product_${product.id}`,
            },
          ]);

          // Tambahkan tombol "Kembali ke Menu Utama" di atas produk
          const options = {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔙 Kembali ke Menu Utama",
                    callback_data: "menu_utama",
                  },
                ],
                ...keyboard,
              ],
            },
          };

          // Mengedit pesan sebelumnya menjadi daftar produk
          const message = `📦 *Menampilkan produk berdasarkan kategori ${category}:*\n\nPilih produk untuk melihat detail.`;

          // Edit pesan yang berisi daftar kategori menjadi pesan produk
          bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            ...options,
          });
        } else {
          bot.sendMessage(
            chatId,
            `❗ Tidak ada produk di kategori ${category}.`
          );
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        bot.sendMessage(
          chatId,
          "❗ Terjadi kesalahan saat mengambil produk dari kategori."
        );
      }
    }

    // Menangani tombol "🔙 Kembali ke Kategori"
    if (data === "back_to_category") {
      try {
        // Mengambil daftar kategori unik dari Supabase
        const { data: products, error } = await supabase
          .from("products")
          .select("id, category, price")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        // Mengambil kategori unik
        const categories = [
          ...new Set(products.map((product) => product.category)),
        ];

        if (categories.length > 0) {
          let keyboard = categories.map((category) => [
            {
              text: `📦 ${category}`,
              callback_data: `category_${category}`,
            },
          ]);

          const message =
            "📦 *Berikut adalah daftar kategori kami:*\n\nPilih kategori untuk melihat lebih detail.";

          // Tambahkan tombol "Kembali ke Menu Utama" di atas kategori
          const options = {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔙 Kembali ke Menu Utama",
                    callback_data: "menu_utama",
                  },
                ],
                ...keyboard,
              ],
            },
          };

          // Edit pesan produk kembali ke daftar kategori
          bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            ...options,
          });
        } else {
          bot.sendMessage(chatId, "❗ Tidak ada kategori yang tersedia.");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        bot.sendMessage(
          chatId,
          "❗ Terjadi kesalahan saat mengambil kategori."
        );
      }
    }

    // Menangani pilihan produk
    if (data.startsWith("product_")) {
      const productId = data.split("_")[1];
      try {
        const { data: product, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (error) {
          throw error;
        }

        // Memastikan URL gambar produk ada
        const imageUrl = product.image_url || "https://gtftsindekhywtwmoeie.supabase.co/storage/v1/object/public/xcreate/tele.png"; // Gambar default jika tidak ada gambar

        // Kirim gambar terlebih dahulu
        bot.sendPhoto(chatId, imageUrl, { caption: product.name }).then(() => {
          // Setelah gambar dikirim, kirim pesan detail produk
          const message = `✨ *Detail Produk* ✨\n\n**Nama Produk:** ${
            product.name
          }\n**Harga:** ${new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(product.price)}\n\n*Deskripsi:* \n${product.description}`;

          // Kirim pesan detail produk setelah gambar dikirim
          bot.sendMessage(chatId, message, {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "💵 Beli",
                    callback_data: `buy_product_${product.id}`,
                  },
                ],
                [
                  {
                    text: "🎮 Demo Tampilan",
                    url: `https://xcreate-store.web.app?produkid=${product.id}`,
                  },
                ],
              ],
            },
          });
        });
      } catch (error) {
        console.error("Error fetching product details:", error);
        bot.sendMessage(
          chatId,
          "❗ Terjadi kesalahan saat mengambil detail produk."
        );
      }
    }

    // Menangani tombol "Beli" yang mengarah ke @xcodedesain
    if (data.startsWith("buy_product_")) {
      const productId = data.split("_")[2];
      bot.sendMessage(
        chatId,
        `💬 Untuk membeli produk ini, silakan hubungi @xcodedesain.`
      );
    }
  });
};
