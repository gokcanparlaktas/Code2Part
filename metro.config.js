const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// catalog-data lives outside src/; include it for bearing JSON imports.
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, 'data')];

module.exports = config;
