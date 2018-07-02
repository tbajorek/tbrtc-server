const webpack = require('webpack');

const root = require('app-root-path');

const config = {
    plugins: [
        new webpack.DefinePlugin({
            ROOT_DIR: JSON.stringify(`${root}/src/locale`),
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
