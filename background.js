
// Background script to handle API calls and avoid CORS/CSP issues in content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "generateContent") {
        const apiKey = request.apiKey;
        const prompt = request.prompt;
        // Default to gemini-2.5-flash if not specified
        const model = request.model || "gemini-2.5-flash";

        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                sendResponse({ success: false, error: data.error.message });
            } else {
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No answer generated.";
                sendResponse({ success: true, answer: text });
            }
        })
        .catch(error => {
            sendResponse({ success: false, error: error.message });
        });

        return true; // Indicates we will respond asynchronously
    }
});
