const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://gtftsindekhywtwmoeie.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZnRzaW5kZWtoeXd0d21vZWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMjM0MTgsImV4cCI6MjAzOTY5OTQxOH0.t8z_I35XrHpdHz3QzLo05HS4THlOefcPf8rZElC6P9o"
);

// Menambahkan tombol callback baru
async function addCallbackButton(botId, buttonName, callbackData, response) {
  const { data, error } = await supabase.from("callback_buttons").insert([
    {
      bot_id: botId,
      button_name: buttonName,
      callback_data: callbackData,
      response,
    },
  ]);

  if (error) {
    return `Error: ${error.message}`;
  }

  return `Tombol callback "${buttonName}" telah berhasil ditambahkan.`;
}

// Menampilkan daftar tombol callback
async function listCallbackButtons(botId) {
  const { data: buttons, error } = await supabase
    .from("callback_buttons")
    .select("button_name, callback_data, response")
    .eq("bot_id", botId);

  if (error) {
    return "Error fetching callback buttons.";
  }

  if (buttons.length === 0) {
    return "Tidak ada tombol callback yang tersedia.";
  }

  let buttonsMessage = "🔘 *Daftar Tombol Callback:*\n\n";
  buttons.forEach((button, index) => {
    buttonsMessage += `${index + 1}. ${button.button_name} - ${
      button.response
    }\n`;
  });

  return buttonsMessage;
}

// Mengedit respon balasan tombol callback
async function editCallbackResponse(callbackId, newResponse) {
  const { data, error } = await supabase
    .from("callback_buttons")
    .update({ response: newResponse })
    .eq("id", callbackId);

  if (error) {
    return `Error: ${error.message}`;
  }

  return `Respon balasan tombol berhasil diperbarui.`;
}

module.exports = {
  addCallbackButton,
  listCallbackButtons,
  editCallbackResponse,
};
