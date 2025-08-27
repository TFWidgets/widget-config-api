export default async function shopifyWebhook(req, res) {
    try {
        const order = req.body;

        const clientId = `shopify_${order.id}_${Date.now()}`;

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 7);

        const config = {
            target: targetDate.toISOString(),
            title: "⚡ Your Personal Discount",
            labels: { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" },
            doneText: "Discount expired",
            theme: "fire",
            effects: { glow: true, animation: true }
        };

        await saveConfigToGitHub(clientId, config);

        const embedCode = `<script src="https://countdown-timer-widget.pages.dev/dist/embed.js" data-id="${clientId}"></script>`;

        await sendEmail(order.email, {
            subject: "Your Personal Countdown Timer",
            html: `<h2>Thanks for your order!</h2><p>Your timer is ready:</p><code>${embedCode}</code>`
        });

        res.json({ success: true, clientId });
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({ error: error.message });
    }
}
