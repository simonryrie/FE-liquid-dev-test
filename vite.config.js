import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { Liquid } from 'liquidjs';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

function liquidPlugin() {
  const engine = new Liquid();

  // Register custom 'money' filter to mimic Shopify's money filter
  engine.registerFilter('money', (value) => {
    if (value === null || value === undefined) return '';

    // Convert to number and divide by 100 to get dollars from cents
    const amount = Number(value) / 100;

    // Format with 2 decimal places and add dollar sign
    return '£' + amount.toFixed(2);
  });

  // Register 'image_tag' filter to mimic Shopify's image_tag
  // Usage: {{ image_url | image_tag }} or {{ image_url | image_tag: alt: 'text', class: 'my-class' }}
  engine.registerFilter('image_tag', function(url, ...args) {
    if (!url) return '';

    // LiquidJS passes named parameters as arrays [key, value]
    // Convert them to an options object
    const options = {};
    args.forEach(arg => {
      if (Array.isArray(arg) && arg.length === 2) {
        options[arg[0]] = arg[1];
      }
    });

    // Build attributes
    let attributes = [`src="${url}"`];

    // Alt text (default to empty string if not provided)
    const altText = options.alt !== undefined ? options.alt : '';
    attributes.push(`alt="${altText}"`);

    // Add optional attributes if provided
    if (options.class) attributes.push(`class="${options.class}"`);
    if (options.width) attributes.push(`width="${options.width}"`);
    if (options.height) attributes.push(`height="${options.height}"`);

    // Always add lazy loading like Shopify does
    attributes.push('loading="lazy"');

    return `<img ${attributes.join(' ')}>`;
  });

  // Register 'img_url' filter for image URL transformations (simplified version)
  // Usage: {{ product.featured_image | img_url: '100x100' }}
  engine.registerFilter('img_url', (url, size) => {
    if (!url) return '';
    // In real Shopify, this handles size parameters like '100x100', 'medium', etc.
    // For this test environment, we just return the URL as-is
    return url;
  });

  return {
    name: 'vite-plugin-liquid',
    configureServer(server) {
      // Watch liquid and json files
      server.watcher.add([
        'src/sections/*.liquid',
        'collection.json'
      ]);

      // Trigger full reload on liquid/json changes
      server.watcher.on('change', (file) => {
        if (file.endsWith('.liquid') || file.endsWith('.json')) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        try {
          const template = readFileSync('./src/sections/template.liquid', 'utf8');
          const data = JSON.parse(readFileSync('./collection.json', 'utf8'));
          const rendered = await engine.parseAndRender(template, data);

          // Update title and inject Liquid content
          return html
            .replace('<title>Shopify Developer Test</title>', `<title>${data.collection.title}</title>`)
            .replace('<div id="liquid-content"></div>', rendered);
        } catch (error) {
          console.error('Liquid render error:', error);
          return html.replace('<div id="liquid-content"></div>', `<pre>Error: ${error.message}</pre>`);
        }
      }
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    liquidPlugin(),
    viteSingleFile()
  ],
  server: {
    open: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
