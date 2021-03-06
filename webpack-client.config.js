const webpack = require('webpack');
const path = require('path');

const root = require('app-root-path');

const config = {
    entry: './mocked_client/src/index.js',
    output: {
        path: path.resolve('./mocked_client'),
        filename: 'client.js',
    },
    target: 'node',
    plugins: [
        new webpack.DefinePlugin({
            __LOCALE_DIR__: JSON.stringify(`${root}/src/locale`),
            __VERSION__: JSON.stringify('1.0.0'),
            __CASE__: 3,
        }),
    ],
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    query: {
                        presets: ['@babel/env'],
                        plugins: [
                            ['babel-plugin-transform-builtin-extend', {
                                globals: ['Error', 'Array'],
                            }],
                        ],
                    },
                },
                include: [
                    '/node_modules/tbrtc-common',
                ],
            },
        ],
    },
};

module.exports = config;
