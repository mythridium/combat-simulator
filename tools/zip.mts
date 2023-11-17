import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { resolve } from 'path';
import { deleteSync } from 'del';
import archiver from 'archiver';
import pkg from '../package.json' assert { type: 'json' };

class Zip {
    public async run(outDir: string, inDir: string, name: string) {
        if (!existsSync(outDir)) {
            mkdirSync(outDir);
        }

        const output = createWriteStream(resolve(outDir, name));
        const archive = archiver('zip');

        output.on('close', () => {
            console.log(name + ': ' + archive.pointer() + ' total bytes');
        });

        archive.on('error', err => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(inDir, false);
        await archive.finalize();
    }
}

(async () => {
    const zip = new Zip();

    deleteSync('build');

    if (existsSync('.output')) {
        await zip.run('build', '.output', `${pkg.name}-${pkg.version}.zip`);
    }

    deleteSync('.output');
})();
