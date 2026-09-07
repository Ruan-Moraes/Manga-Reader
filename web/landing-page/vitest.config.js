"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("vitest/config");
var plugin_react_swc_1 = require("@vitejs/plugin-react-swc");
var node_path_1 = require("node:path");
exports.default = (0, config_1.defineConfig)({
    plugins: [(0, plugin_react_swc_1.default)()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        css: false,
    },
    resolve: {
        alias: {
            '@': node_path_1.default.resolve(__dirname, 'src'),
        },
    },
});
