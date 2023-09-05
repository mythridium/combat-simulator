const archiver = require('archiver');
const copydir = require('copy-dir');
const fs = require('fs');
const path = require('path');

(async () => {
    fs.rmSync('build', { recursive: true, force: true });

    copydir.sync('styles', 'dist/styles');
    copydir.sync('icons', 'dist/icons');

    const { version } = require('./package.json');
    // copy manifest.json
    const manifest = JSON.parse(fs.readFileSync('manifest.json').toString());
    manifest.version = version;
    fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 4));

    const zipName = path.join(__dirname, 'build', `myth-combat-simulator-v${version}.zip`);
    console.log(zipName)
    fs.mkdirSync(path.dirname(zipName), { recursive: true });

    const output = fs.createWriteStream(zipName);
    const archive = archiver('zip');
    archive.pipe(output);

    archive.directory('dist', '');

    if (require.main === module) {
        await archive.finalize();
    }
    exports.zipName = zipName;
    exports.archive = archive;

    fs.rmSync('dist', { recursive: true, force: true });

    console.log(version);
    console.log("Build finished at: " + new Date())
})()

