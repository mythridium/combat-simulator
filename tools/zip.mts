import { existsSync, createWriteStream } from 'fs';
import { rm, mkdir } from 'fs/promises';
import { resolve } from 'path';
import archiver from 'archiver';
import pkg from '../package.json' with { type: 'json' };

abstract class Zip {
    public static async run(output: string, src: string, name: string) {
        // if we cannot locate the existing build src, not much we can do at this stage, most
        // likely a bug has been introduced.
        if (!existsSync(src)) {
            throw new Error(`Could not locate '${src}'.`);
        }

        await mkdir(output);

        const stream = createWriteStream(resolve(output, name));
        const archive = archiver('zip');

        stream.on('close', () => console.log(`${name}: ${archive.pointer()} bytes`));
        archive.on('error', err => {
            throw err;
        });

        archive.pipe(stream);
        archive.directory(src, false);

        await archive.finalize();
    }
}

try {
    const output = 'build';
    const src = '.output';
    const now = Date.now();
    const fileName = `${pkg.name}-${pkg.version}--${now % 10000}.zip`;

    // remove the existing output
    await rm(output, { recursive: true, force: true });

    // zip the build src into the output
    await Zip.run(output, src, fileName);

    // remove the existing build src
    await rm(src, { recursive: true, force: true });
} catch (exception) {
    console.error(exception);
}
