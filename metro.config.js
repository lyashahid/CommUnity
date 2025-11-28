const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for @/ imports
config.resolver.alias = {
  '@': './src',
};

// Add support for tsconfig paths
config.resolver.nodeModulesPaths = [
  ...config.resolver.nodeModulesPaths,
];

module.exports = config;
