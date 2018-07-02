const webpack = require('webpack');
const path = require('path');

const root = require('app-root-path');

const config = {
    entry: './test/index.js',
    output: {
        path: path.resolve('./build'),
        filename: 'server.js',
    },
    target: 'node',
    plugins: [
        new webpack.DefinePlugin({
            ROOT_DIR: JSON.stringify(`${root}/src/locale`),
            __VERSION__: JSON.stringify('1.0.0'),
        }),
    ],
    module: {
        loaders: [
            {
                test: /.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['env', 'stage-0'],
                    plugins: [
                        ['babel-plugin-transform-builtin-extend', {
                            globals: ['Error', 'Array'],
                        }],
                    ],
                },
            },
        ],
    },
};

module.exports = config;
