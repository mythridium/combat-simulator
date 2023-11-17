import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { resolve } from 'path';
import { Configuration } from 'webpack';

const isProduction = process.argv[process.argv.indexOf('--mode') + 1] === 'production';

const config: Configuration = {
    mode: isProduction ? 'production' : 'development',
    entry: { setup: 'src/setup.ts', simulator: 'src/app/worker/simulator.ts' },
    output: {
        filename: '[name].mjs',
        path: resolve(__dirname, '.output'),
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
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: '**/*.html', to: '[path][name][ext]', context: 'src', noErrorOnMissing: true },
                { from: 'manifest.json', to: 'manifest.json', context: 'src', noErrorOnMissing: true },
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

if (!isProduction) {
    config.devtool = 'inline-source-map';
    config.optimization = {
        minimize: false,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    mangle: false,
                    compress: false,
                    keep_classnames: true,
                    keep_fnames: true,
                    sourceMap: false
                }
            })
        ]
    };
}

export default config;
