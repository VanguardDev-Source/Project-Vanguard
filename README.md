# PROJECT: MANDURUGAS

Project: Mandurugas is a powerful Chrome Extension that automates answering Google Forms using Google's Gemini AI models.

## Features

### 🚀 Smart AI Integration
- **Multiple Model Support**: Choose the performance tier that fits your needs.
  - `Gemini 2.5 Flash`: 10 Requests Per Minute (RPM).
  - `Gemini 2.5 Flash Lite`: 15 RPM.
  - `Gemini 2.0 Flash Lite`: 30 RPM.
- **Smart Rate Limiting**: Automatically handles API rate limits with a 90-second cooldown logic.
- **Batch Processing**: Fills answers immediately when a rate limit is hit, so you don't have to wait for the cooldown to see progress.

### 🛠 Control Panel
- **Embedded UI**: Controls are injected directly into the Google Form page for easy access.
- **Custom API Key**: Securely input your own Gemini API Key to power the extension.

### 🤖 Automation Modes
- **Append Mode**: The AI analyzes the question and appends the suggested answer to the question title. It does not select options for you.
- **Auto Mode**: The AI fills out text fields and selects radio buttons, checkboxes, and dropdowns automatically.

### 🧠 Question Support
- **Paragraphs/Short Answer**: Generates concise text answers.
- **Multiple Choice (Radio)**: Selects the best option.
- **Checkboxes**: Selects multiple options if applicable.
- **Dropdowns**: Scans dropdown options and selects the correct one.
- **Intelligent Filtering**: Automatically ignores system fields like "Record email" checkboxes.

### 🎨 Visual Experience
- **Styled Suggestions**: Answers for text and radio questions are highlighted in blue badges.
- **Clean Integration**: Answers for Dropdowns and Checkboxes are appended as plain text to keep the form clean.

## Usage
1. Open a Google Form.
2. Look for the **project: mandurugas** card at the top.
3. Select your **Model** and **Action Mode**.
4. Enter your **Gemini API Key**.
5. Click **SCAN & FILL**.

## 🚀 Installation

Since this extension is currently in **Developer Preview** (not yet on the Chrome Web Store), you need to install it manually. Don't worry, it takes less than a minute!

1.  **Download the Code:**
    * Click the green **Code** button at the top of this page.
    * Select **Download ZIP**.
    * Extract (unzip) the downloaded file to a folder on your computer. Remember where you put it!

2.  **Open Chrome Extensions Management:**
    * Open Google Chrome.
    * In the address bar, type: `chrome://extensions` and hit Enter.
    * Alternatively, click the puzzle piece icon 🧩 (top right) -> **Manage Extensions**.

3.  **Enable Developer Mode:**
    * Look at the top right corner of the Extensions page.
    * Toggle the switch for **Developer mode** to **ON**.

4.  **Load the Extension:**
    * Click the button that appears on the top left called **Load unpacked**.
    * Navigate to the folder you unzipped in Step 1.
    * **Important:** Select the folder that *contains* the `manifest.json` file (usually the main folder).
    * Click **Select Folder**.

🎉 The extension should now appear in your list and is ready to use!

---

## 🔑 How to Get Your Free Gemini API Key

To make the AI work, you need your own API Key from Google. It is free for personal use within standard limits.

1.  **Go to Google AI Studio:**
    * Visit [aistudio.google.com](https://aistudio.google.com/).

2.  **Sign In:**
    * Log in with your Google account.

3.  **Generate the Key:**
    * Click on the blue **"Get API key"** button (usually on the top left).
    * Click **"Create API key"**.
    * Select **"Create API key in new project"** (this is the easiest option).

4.  **Copy the Key:**
    * You will see a long string of random characters starting with `AIza...`.
    * **Copy** this key.

5.  **Activate the Extension:**
    * Open the Extension by clicking its icon in your browser.
    * Paste your API key into the settings/input field.
    * Save/Submit.

> **Privacy Note:** Your API key is stored locally on your browser. It is never sent to my server; it goes directly from your browser to Google's servers to generate answers.
