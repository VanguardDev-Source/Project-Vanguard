(function() {
    // Prevent double injection
    if (window.formAI_Active) return;
    window.formAI_Active = true;

    console.log("project: mandurugas v3.5 loaded.");

    // Main entry point: Inject UI when the page is ready
    const observer = new MutationObserver((mutations, obs) => {
        const formList = document.querySelector('div[role="list"]');
        if (formList) {
            injectControlPanel(formList);
            obs.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Fallback if mutation observer misses it (already loaded)
    setTimeout(() => {
        const formList = document.querySelector('div[role="list"]');
        if (formList && !document.getElementById('form-ai-card')) {
            injectControlPanel(formList);
        }
    }, 1000);


    function injectControlPanel(formList) {
        // mimic Google Form Card Style
        const card = document.createElement('div');
        card.id = 'form-ai-card';
        card.style.cssText = `
            background-color: white;
            border: 1px solid #dadce0;
            border-radius: 8px;
            margin-bottom: 12px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12);
            position: relative;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
        `;

        card.innerHTML = `
            <div style="border-left: 5px solid #000000ff; padding-left: 15px; margin-bottom: 20px;">
                <h3 style="font-size: 24px; font-weight: 400; color: #202124; margin: 0;">project: mandurugas</h3>
\            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-size: 12px; font-weight: bold; color: #5f6368; margin-bottom: 5px; text-transform: uppercase;">Model (RPM Limit)</label>
                <select id="fai-model" style="width: 100%; padding: 8px; background: #f8f9fa; border: 1px solid #dadce0; border-radius: 4px; font-size: 14px;">
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (10 RPM)</option>
                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (15 RPM) Recommended</option>
                    <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (30 RPM)</option>
                </select>
            </div>

            <div id="fai-key-container" style="margin-bottom: 15px;">
                <label style="display: block; font-size: 12px; font-weight: bold; color: #5f6368; margin-bottom: 5px; text-transform: uppercase;">Gemini API Key</label>
                <input type="password" id="fai-api-key" placeholder="Paste API Key..." style="width: 100%; padding: 8px 0; border: none; border-bottom: 1px solid #e0e0e0; outline: none; font-size: 14px; transition: border-color 0.2s;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; font-weight: bold; color: #5f6368; margin-bottom: 5px; text-transform: uppercase;">Action Mode</label>
                <select id="fai-mode" style="width: 100%; padding: 10px; background: #f8f9fa; border: 1px solid #dadce0; border-radius: 4px; font-size: 14px; outline: none; cursor: pointer;">
                    <option value="append">Append Mode (Suggestion Only)</option>
                    <option value="auto">Auto Mode (Fill & Select)</option>
                </select>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span id="fai-status" style="font-size: 12px; color: #5f6368; font-style: italic;">Ready.</span>
                <button id="fai-scan-btn" style="background-color: white; color: black; border: none; padding: 10px 24px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                    SCAN & FILL
                </button>
            </div>
        `;

        // Insert as the first item in the list
        formList.insertBefore(card, formList.firstChild);

        // Event Listeners
        const input = card.querySelector('#fai-api-key');

        input.addEventListener('focus', () => input.style.borderBottom = '2px solid #1a73e8');
        input.addEventListener('blur', () => input.style.borderBottom = '1px solid #e0e0e0');

        document.getElementById('fai-scan-btn').addEventListener('click', startScan);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function startScan() {
        const model = document.getElementById('fai-model').value;
        const apiKey = document.getElementById('fai-api-key').value.trim();
        const mode = document.getElementById('fai-mode').value;
        const statusEl = document.getElementById('fai-status');

        if (!apiKey) {
            statusEl.textContent = "Error: API Key required.";
            statusEl.style.color = "#d93025";
            return;
        }

        // Determine RPM Limit based on model
        let rpmLimit = 10; // Default for gemini-2.5-flash
        if (model === 'gemini-2.5-flash-lite') rpmLimit = 15;
        else if (model === 'gemini-2.0-flash-lite') rpmLimit = 30;

        statusEl.textContent = "Scanning form elements...";
        statusEl.style.color = "#1a73e8";

        // Scrape (and interact with dropdowns if needed)
        const questions = await scrapeQuestions(statusEl);
        
        if (questions.length === 0) {
            statusEl.textContent = "No questions found.";
            return;
        }

        const answers = [];
        let requestCount = 0;
        let lastAppliedIndex = 0; // Track applied answers to handle batches

        // Process questions sequentially
        for (let i = 0; i < questions.length; i++) {
            // Rate Limiting Logic
            if (requestCount > 0 && requestCount % rpmLimit === 0) {
                // Apply the answers gathered so far BEFORE sleeping
                const batch = answers.slice(lastAppliedIndex);
                if (batch.length > 0) {
                    statusEl.textContent = `Limit reached. Filling ${batch.length} answers before cooldown...`;
                    await applyAnswers(batch, mode);
                    lastAppliedIndex = answers.length; // Update index so we don't re-apply
                }

                // Cooldown 90 seconds (1min 30s)
                for (let s = 90; s > 0; s--) {
                    statusEl.textContent = `Rate Limit (${rpmLimit} RPM) Cooldown: ${s}s...`;
                    await sleep(1000);
                }
            }

            const q = questions[i];
            statusEl.textContent = `Thinking... (${i + 1}/${questions.length}) [${model}]`;
            
            let prompt = "";
            if (q.type === 'paragraph') {
                prompt = `You are a Google Form assistant. Answer this question concisely and straight to the point. Question: "${q.text}"`;
            } else if ((q.type === 'radio' || q.type === 'checkbox' || q.type === 'dropdown') && q.options && q.options.length > 0) {
                prompt = `Question: "${q.text}".\nOptions: ${JSON.stringify(q.options)}.\nSelect the most appropriate option(s) from the list. Return ONLY the text of the selected option(s) exactly as written. If multiple apply (checkbox), separate with commas. Do not add explanations.`;
            } else {
                prompt = `Provide a very short, single-sentence completion or answer option for this question: "${q.text}". Keep it under 10 words.`;
            }

            try {
                const response = await chrome.runtime.sendMessage({
                    action: "generateContent",
                    apiKey: apiKey,
                    prompt: prompt,
                    model: model
                });
                requestCount++;

                if (response.success) {
                    let answerText = response.answer;
                    // Credit signature for paragraph
                    if (q.type === 'paragraph') {
                        answerText = answerText.trim() + " :)";
                    }

                    answers.push({
                        id: q.id,
                        answer: answerText.trim(),
                        type: q.type,
                        element: q.element // Store reference for applying answer
                    });
                } else {
                    console.error("AI Error:", response.error);
                }

            } catch (err) {
                console.error("Connection Error:", err);
            }
        }

        // Apply remaining answers
        statusEl.textContent = "Applying final batch...";
        const finalBatch = answers.slice(lastAppliedIndex);
        if (finalBatch.length > 0) {
            await applyAnswers(finalBatch, mode);
        }
        
        statusEl.textContent = "Done!";
        statusEl.style.color = "#188038";
    }

    async function scrapeQuestions(statusEl) {
        const questions = [];
        const items = document.querySelectorAll('div[role="listitem"]');

        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            // Skip our own card
            if(item.id === 'form-ai-card') continue;

            const heading = item.querySelector('div[role="heading"]');
            if (!heading) continue;

            const text = heading.innerText.replace(/\*/g, '').trim();
            
            // IGNORE EMAIL CHECKBOX ("Record <email> as the email...")
            if (text.toLowerCase().includes('record') && text.toLowerCase().includes('email')) {
                console.log("Skipping email collection checkbox:", text);
                continue;
            }
            
            const textarea = item.querySelector('textarea');
            const textInput = item.querySelector('input[type="text"]:not([style*="display: none"])');
            const radios = item.querySelectorAll('div[role="radio"]');
            const checkboxes = item.querySelectorAll('div[role="checkbox"]');
            const dropdown = item.querySelector('div[role="listbox"]');
            
            let type = 'other';
            let options = [];

            if (textarea || (textInput && radios.length === 0 && checkboxes.length === 0 && !dropdown)) {
                type = 'paragraph'; 
            } else if (radios.length > 0) {
                type = 'radio';
                radios.forEach(r => {
                    const val = r.getAttribute('aria-label') || r.innerText;
                    if (val) options.push(val);
                });
            } else if (checkboxes.length > 0) {
                type = 'checkbox';
                checkboxes.forEach(c => {
                    const val = c.getAttribute('aria-label') || c.innerText;
                    if (val) options.push(val);
                });
            } else if (dropdown) {
                type = 'dropdown';
                // Dropdown interaction to get options
                statusEl.textContent = `Scanning dropdown options (${index+1})...`;
                
                // Click to open
                dropdown.click();
                await sleep(300); // Wait for animation

                // Find options
                const optionEls = document.querySelectorAll('div[role="option"]');
                
                // Filter visible options
                optionEls.forEach(opt => {
                    if (opt.offsetParent !== null) {
                        const val = opt.getAttribute('data-value') || opt.innerText;
                        if (val && val.toLowerCase() !== 'choose') {
                            options.push(val.trim());
                        }
                    }
                });

                // Close it
                dropdown.click(); 
                await sleep(200);
            }

            questions.push({
                id: index,
                element: item,
                text: text,
                type: type,
                options: options
            });
        }

        return questions;
    }

    async function applyAnswers(answers, mode) {
        for (const ans of answers) {
            const item = ans.element;
            if (!item) continue;

            const heading = item.querySelector('div[role="heading"]');

            // 1. Visual Updates
            let shouldAppendPlain = false;
            let shouldAppendStyled = false;

            // Dropdowns and Checkboxes always get plain text appended (as per request)
            // Dropdown logic from before + Checkbox logic from update
            if (ans.type === 'dropdown') {
                shouldAppendPlain = true;
            } else if (ans.type === 'checkbox') {
                shouldAppendPlain = true;
            } else {
                // Radio, Paragraph
                if (mode === 'append') {
                    shouldAppendStyled = true;
                }
            }

            if (heading && !heading.innerText.includes(':) ')) {
                if (shouldAppendPlain) {
                    // Plain text for Dropdown and Checkbox
                    heading.insertAdjacentText('beforeend', `:) ${ans.answer}`);
                } else if (shouldAppendStyled) {
                    // Styled for others in Append mode
                    const span = document.createElement('span');
                    span.innerText = `:)${ans.answer}`;
                    heading.appendChild(span);
                }
            }

            // 2. Action Logic (Filling the form)
            if (mode === 'append') continue;

            if (mode === 'auto') {
                if (ans.type === 'paragraph') {
                    const inputEl = item.querySelector('textarea') || item.querySelector('input[type="text"]');
                    if (inputEl) {
                        inputEl.value = ans.answer;
                        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                } else if (ans.type === 'radio' || ans.type === 'checkbox') {
                    const aiOptions = ans.answer.split(',').map(s => s.trim().toLowerCase());
                    const selector = ans.type === 'radio' ? 'div[role="radio"]' : 'div[role="checkbox"]';
                    const choices = item.querySelectorAll(selector);

                    choices.forEach(choice => {
                        const choiceText = (choice.getAttribute('aria-label') || choice.innerText).trim().toLowerCase();
                        // Exact match preferred, then partial
                        const isMatch = aiOptions.some(opt => choiceText === opt || (opt.length > 3 && choiceText.includes(opt)));
                        
                        if (isMatch) {
                            const isChecked = choice.getAttribute('aria-checked') === 'true';
                            if (!isChecked) {
                                choice.click();
                            }
                        }
                    });
                } else if (ans.type === 'dropdown') {
                    // Handling dropdown selection
                    const dropdown = item.querySelector('div[role="listbox"]');
                    if (dropdown) {
                        const targetText = ans.answer.trim().toLowerCase();
                        
                        // Optimization: Check if already selected
                        const currentText = (dropdown.innerText || "").toLowerCase();
                        if (currentText === targetText || (targetText.length > 3 && currentText.includes(targetText))) {
                            continue; 
                        }

                        // Open
                        dropdown.click();
                        await sleep(300);

                        const optionEls = document.querySelectorAll('div[role="option"]');
                        let clicked = false;

                        for (const opt of optionEls) {
                            if (opt.offsetParent !== null) { // Visible
                                const optText = (opt.getAttribute('data-value') || opt.innerText).trim().toLowerCase();
                                if (optText === targetText || (targetText.length > 3 && optText.includes(targetText))) {
                                    opt.click();
                                    clicked = true;
                                    break;
                                }
                            }
                        }

                        if (!clicked) {
                            dropdown.click(); // Close if not found
                        }
                        await sleep(300);
                    }
                }
            }
        }
    }
})();