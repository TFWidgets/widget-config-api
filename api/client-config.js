import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const OWNER = 'TFWidgets';
const REPO = 'countdown-timer-widget';
const BRANCH = 'main';

export default async function handler(req, res) {
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'POST') {
        try {
            const { clientId, targetDate, settings = {} } = req.body;
            
            if (!clientId || !targetDate) {
                return res.status(400).json({ 
                    error: 'clientId и targetDate обязательны' 
                });
            }
            
            // Формируем конфигурацию
            const config = {
                target: targetDate,
                title: settings.title || null,
                labels: settings.labels || {
                    days: "Days",
                    hours: "Hours", 
                    minutes: "Minutes",
                    seconds: "Seconds"
                },
                doneText: settings.doneText || "Completed",
                theme: settings.theme || "gradient",
                effects: settings.effects || { glow: true }
            };
            
            const path = `configs/${clientId}.json`;
            let sha;
            
            // Проверяем существование файла
            try {
                const { data } = await octokit.rest.repos.getContent({
                    owner: OWNER,
                    repo: REPO,
                    path,
                    ref: BRANCH
                });
                sha = data.sha;
            } catch (error) {
                if (error.status !== 404) throw error;
            }
            
            // Создаем/обновляем файл
            await octokit.rest.repos.createOrUpdateFileContents({
                owner: OWNER,
                repo: REPO,
                path,
                message: `Update config for client ${clientId}`,
                content: Buffer.from(JSON.stringify(config, null, 2)).toString('base64'),
                branch: BRANCH,
                sha
            });
            
            const embedCode = `<script src="https://countdown-timer-widget.pages.dev/dist/embed.js" data-id="${clientId}"></script>`;
            
            res.json({
                success: true,
                clientId,
                configUrl: `https://countdown-timer-widget.pages.dev/configs/${clientId}.json`,
                embedCode,
                previewUrl: `https://countdown-timer-widget.pages.dev/test.html`
            });
            
        } catch (error) {
            console.error('Ошибка создания конфигурации:', error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

