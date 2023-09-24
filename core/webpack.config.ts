import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { resolve } from 'path';

const config = {
    mode: 'production',
    entry: { core: 'core/core.ts' },
    output: {
        filename: '[name].mjs',
        path: resolve(__dirname, '../.output/core'),
        library: {
            type: 'module'
        },
        clean: true
    },
    experiments: {
        outputModule: true
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    optimization: {
        minimize: false,
        minimizer: [
            new TerserPlugin({
                terserOptions: { mangle: false, compress: false, keep_classnames: true, keep_fnames: true }
            })
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'manifest.json', to: 'manifest.json', context: 'core', noErrorOnMissing: true },
                { from: 'assets', to: 'assets', noErrorOnMissing: true }
            ]
        })
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        modules: [resolve('./node_modules'), resolve('.')]
    },
    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                use: ['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    }
};

export default config;
