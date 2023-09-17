import { existsSync, mkdirSync, createWriteStream, readdir } from 'fs';
import { resolve, join } from 'path';
import { deleteSync } from 'del';
import archiver from 'archiver';
import pkg from '../package.json' assert { type: 'json' };

const dir = 'build';

if (!existsSync(dir)) {
    mkdirSync(dir);
}

const time = Date.now();
const outname = `${pkg.name}.${time}.zip`;
const output = createWriteStream(resolve(dir, outname));
const archive = archiver('zip');

output.on('close', () => {
    console.log(outname + ': ' + archive.pointer() + ' total bytes');

    deleteSync('packed');
    readdir(dir, (err, files) => {
        if (err) {
            console.log(err);
        }

        files.forEach(file => {
            if (file !== outname) {
                deleteSync(join(dir, file));
            }
        });
    });
});

archive.on('error', err => {
    throw err;
});

archive.pipe(output);
archive.directory('packed/', false);
archive.finalize();
