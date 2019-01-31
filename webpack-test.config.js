const webpack = require('webpack');

const root = require('app-root-path');

const config = {
    mode: 'development',
    target: 'node',
    plugins: [
        new webpack.DefinePlugin({
            __LOCALE_DIR__: JSON.stringify(`${root}/src/locale`),
            __VERSION__: JSON.stringify('1.0.0'),
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
    node: {
        fs: 'empty'
    }
};

module.exports = config;
