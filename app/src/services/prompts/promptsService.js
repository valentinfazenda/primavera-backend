import fs from 'fs/promises';
import path from 'path';

/**
 * Load a prompt file and replace placeholders with corresponding values from the context object.
 * @param {string} promptName - The name of the prompt file to load (without .txt extension).
 * @param {Object} context - An object containing key-value pairs to replace in the template.
 * @returns {Promise<string>} - The template string with the replacements applied.
 */
async function loadPrompt(promptName, context = {}) {
    const filePath = path.resolve(`app/src/prompts${promptName}.txt`);
    let template = await fs.readFile(filePath, 'utf8');

    // Replace placeholders in the format {{key}} with the corresponding value from context
    for (const [key, value] of Object.entries(context)) {
        const regex = new RegExp(`{{\\$${key}}}`, 'g');  // Construct a regex for each key
        template = template.replace(regex, value);
    }

    return template;
}

export { loadPrompt };
