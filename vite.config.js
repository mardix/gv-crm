import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import config from './src/config.json';

const updatedManifest = Object.assign({}, manifest, {
  name: config.appName,
  version: config.version,
  description: config.description,
  action: Object.assign({}, manifest.action, {
    default_title: config.appName
  })
});

export default defineConfig({
  plugins: [
    preact(),
    crx({ manifest: updatedManifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
      },
    },
  },
});
