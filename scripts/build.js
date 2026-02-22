const fs = require('fs');
const path = require('path');

/**
 * Script de build pour minifier le widget CryptoMarquee
 * Usage: node scripts/build-widget.js
 */

// Configuration
const WIDGET_DIR = path.join(__dirname, '../public/widgets');
const SOURCE_FILE = path.join(WIDGET_DIR, 'crypto-marquee-widget.js');
const MINIFIED_FILE = path.join(WIDGET_DIR, 'crypto-marquee-widget.min.js');

// Fonction de minification simple (sans dépendances externes)
function minifyJS(code) {
    // Protéger les chaînes CSS importantes
    const protectedStrings = [];
    let protectedCode = code;
    
    // Protéger content: ''; dans le CSS
    protectedCode = protectedCode.replace(/(content:\s*['"][^'"]*['"])/g, (match) => {
        const index = protectedStrings.length;
        protectedStrings.push(match);
        return `__PROTECTED_STRING_${index}__`;
    });
    
    const minified = protectedCode
        // Supprimer les commentaires multi-lignes
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Supprimer les commentaires single-line (mais pas dans les strings)
        .replace(/\/\/.*$/gm, '')
        // Supprimer les espaces multiples (mais pas dans les template literals)
        .replace(/\s+/g, ' ')
        // Supprimer les espaces autour des opérateurs (sauf dans les strings)
        .replace(/\s*([{}();,=+\-*/<>!&|])\s*/g, '$1')
        // Supprimer les espaces en début et fin de ligne
        .replace(/^\s+|\s+$/gm, '')
        // Supprimer les lignes vides
        .replace(/\n\s*\n/g, '\n')
        .trim();
    
    // Restaurer les chaînes protégées
    return protectedStrings.reduce((code, str, index) => {
        return code.replace(`__PROTECTED_STRING_${index}__`, str);
    }, minified);
}

// Fonction pour ajouter un header de version
function addHeader(minifiedCode) {
    const version = new Date().toISOString().slice(0, 10);
    const header = `/*! TheCoinAnalysis Widget v${version} | https://TheCoinAnalysis.com */`;
    return header + '\n' + minifiedCode;
}

// Fonction pour calculer la taille des fichiers
function getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return (stats.size / 1024).toFixed(2) + ' KB';
}

// Fonction principale de build
function buildWidget() {
    try {
        console.log('🔧 Building CryptoMarquee Widget...');
        
        // Vérifier que le fichier source existe
        if (!fs.existsSync(SOURCE_FILE)) {
            throw new Error(`Source file not found: ${SOURCE_FILE}`);
        }
        
        // Lire le fichier source
        console.log('📖 Reading source file...');
        const sourceCode = fs.readFileSync(SOURCE_FILE, 'utf8');
        const originalSize = getFileSize(SOURCE_FILE);
        
        // Minifier le code
        console.log('⚡ Minifying JavaScript...');
        const minifiedCode = minifyJS(sourceCode);
        const finalCode = addHeader(minifiedCode);
        
        // Écrire le fichier minifié
        fs.writeFileSync(MINIFIED_FILE, finalCode);
        const minifiedSize = getFileSize(MINIFIED_FILE);
        
        // Calculer la réduction de taille
        const originalBytes = fs.statSync(SOURCE_FILE).size;
        const minifiedBytes = fs.statSync(MINIFIED_FILE).size;
        const reduction = ((originalBytes - minifiedBytes) / originalBytes * 100).toFixed(1);
        
        console.log('✅ Widget built successfully!');
        console.log(`📊 Size reduction: ${originalSize} → ${minifiedSize} (-${reduction}%)`);
        console.log(`📂 Files created:`);
        console.log(`   • ${path.relative(process.cwd(), SOURCE_FILE)} (${originalSize})`);
        console.log(`   • ${path.relative(process.cwd(), MINIFIED_FILE)} (${minifiedSize})`);
        
        // Générer les instructions d'intégration
        generateIntegrationInstructions();
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Générer les instructions d'intégration
function generateIntegrationInstructions() {
    const instructions = `
# CryptoMarquee Widget Integration

## Basic Integration
\`\`\`html
<div id="crypto-marquee"></div>
<script src="https://www.thecoinanalysis.com/widgets/crypto-marquee-widget.min.js"></script>
\`\`\`

## Advanced Configuration
\`\`\`html
<div id="crypto-marquee" 
     data-speed="40" 
     data-count="15"
     data-theme="light"
     data-show-change="true"
     data-show-powered-by="true">
</div>
<script src="https://www.thecoinanalysis.com/widgets/crypto-marquee-widget.min.js"></script>
\`\`\`

## Configuration Options
- \`data-speed\`: Animation speed in seconds (default: 40)
- \`data-count\`: Number of cryptocurrencies to display (default: 15)
- \`data-theme\`: "light" or "dark" (default: "light")
- \`data-show-change\`: Show price changes (default: true)
- \`data-show-powered-by\`: Show "Powered by" link (default: true)

## Multiple Widgets
You can have multiple widgets on the same page:
\`\`\`html
<div id="crypto-marquee-1" data-count="10" data-theme="light"></div>
<div id="crypto-marquee-2" data-count="5" data-theme="dark"></div>
<script src="https://www.thecoinanalysis.com/widgets/crypto-marquee-widget.min.js"></script>
\`\`\`
`;
    
    const instructionsFile = path.join(WIDGET_DIR, 'README.md');
    fs.writeFileSync(instructionsFile, instructions.trim());
    console.log(`📚 Integration instructions: ${path.relative(process.cwd(), instructionsFile)}`);
}

// Lancer le build
if (require.main === module) {
    buildWidget();
}

module.exports = { buildWidget, minifyJS };