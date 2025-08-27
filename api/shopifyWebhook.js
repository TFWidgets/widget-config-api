import { saveConfigToGitHub } from "../../lib/github.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const order = body;

    if (!order || !order.id) {
      return res.status(400).json({ error: "Invalid order payload" });
    }

    const clientId = `shopify_${order.id}_${Date.now()}`;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);

    const config = {
      target: targetDate.toISOString(),
      title: "⚡ Your Personal Discount",
      labels: {
        days: "Days",
        hours: "Hours",
        minutes: "Minutes",
        seconds: "Seconds"
      },
      doneText: "Discount expired",
      theme: "fire",
      effects: { glow: true, animation: true }
    };

    // сохраняем конфиг
    await saveConfigToGitHub(clientId, config);

    // генерируем embed-код
    const embedCode = `<script src="https://tfwidgets.github.io/countdown-timer-widget/dist/embed.js" data-id="${clientId}"></script>`;

    // отдаём сразу в ответ
    return res.status(200).json({
      success: true,
      clientId,
      embedCode
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: error.message });
  }
}
