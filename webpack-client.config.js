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
            ROOT_DIR: JSON.stringify(`${root}/src/locale`),
            __VERSION__: JSON.stringify('1.0.0'),
            __CASE__: 3,
        }),
    ],
    module: {
        loaders: [
            {
                test: /.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'stage-0'],
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
