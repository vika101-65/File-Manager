
import readline from 'node:readline';
import { resolve } from 'path';
import { chdir, cwd, exit } from 'node:process';
import { copyFile, createReadStream, createWriteStream, open, readdir, readFile, rename, unlink } from 'node:fs';
import { basename } from 'node:path';
import { arch, cpus, EOL, homedir, hostname } from 'node:os';
import { createHash } from 'node:crypto';
import { createBrotliCompress, createBrotliDecompress } from 'node:zlib';

const userName = process.argv.slice(2)[0].split('=')[1];
console.log(`Welcome to the File Manager, ${userName}`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `You are currently in ${cwd()} > `
});

rl.prompt();

rl.on('line', (line) => {
  const command = line.trim().split(' ');
  switch (command[0]) {
    case '.exit':
      console.log(`Thank you for using File Manager, ${userName}!`);
      exit(0);

    case 'up':
      try {
        if (cwd().split('/').length > 2) {
          chdir('..');
          const newDirectory = cwd();
          rl.setPrompt(`You are currently in ${newDirectory} > `);
        }
      } catch (err) {
        console.error(`chdir: ${err}`);
      }
      break;

    case 'cd':
      try {
        const pathIsGot = command[1];
        const newPath = resolve(pathIsGot);
        const arrNewPath = newPath.split('/');

        if (arrNewPath.length >= 2 && arrNewPath[1] !== '') {
          chdir(newPath);
          rl.setPrompt(`You are currently in ${cwd()} > `);
        }
      } catch (error) {
        console.error('Wrong path')
      }
      break;

    case 'ls':
      try {
        const currentPath = cwd();

        readdir(currentPath, (err, files) => {
          if (err) {
            console.error(err);
            return;
          };
          const directory = [];
          const file = [];

          files.forEach(item => {
            if(item.includes('.')) {
              file.push(item);
              return;
            };

            directory.push(item);  
          });

          const directorySort = directory.sort((x, y) => x.localeCompare(y));
          const fileSort = file.sort((x, y) => x.localeCompare(y));

          const dataForTable = [...directorySort.map(item => ({name: item, type: 'directory'})), 
                                ...fileSort.map(item => ({name: item, type: 'file'}))];

          console.log()
          console.table(dataForTable);
          rl.prompt();
        });

      } catch (err) {
        console.error('Wrong path');
      }
      break;

    case 'cat': {
      try {
        const pathToFile = command[1];
        const newPath = resolve(pathToFile);
        const readableSream = createReadStream(newPath);

        readableSream.on('data', function (chunk) {
          console.log(chunk.toString());
          readableSream.destroy();
          rl.prompt();
        });
 
      } catch (error) {
        console.error('Operation failed');
      }
      break;
    }

    case 'add': {
      try {
        const fileNameGot = command[1];
        const pathFile = resolve(cwd(), fileNameGot);
        open(pathFile, 'wx', (err, f) => {
          if (err) {
            console.error(err);
            rl.prompt();
            return;
          }
          console.log(`Created ${fileNameGot} in current working directory`);
          rl.prompt();
        })

      } catch (error) {
        console.error('Operation failed');
      }
      break;
    }

    case 'rn': {
      try {
        const pathToFileGot = command[1];
        const newFileNameGot = command[2];
        const pathFileOld = resolve(pathToFileGot);
        const pathFileNew = resolve(pathToFileGot, '../', newFileNameGot);
        rename(pathFileOld, pathFileNew, (err) => {
          if (err) {
            console.error(err);
            rl.prompt();
            return;
          }
          
          rl.prompt();
        })

      } catch (error) {
        console.error('Operation failed');
      }
      break;
    }

    case 'cp': {
      try {
        const pathToFileGot = command[1];
        const pathFile = resolve(pathToFileGot);
        const nameFile = basename(pathFile);
        const pathToNewDirectoryGot = command[2];
        const newPathFile = resolve(pathToNewDirectoryGot, './', nameFile);
        
        copyFile(pathFile, newPathFile, (err) => {
          if (err) {
            console.error(err);
            rl.prompt();
            return;
          }

          rl.prompt();
        })

      } catch (error) {
        console.error('Operation failed');
      }
      break;
    }

    case 'mv': {
      try {
        const pathToFileGot = command[1];
        const pathFile = resolve(pathToFileGot);
        const nameFile = basename(pathFile);
        const pathToNewDirectoryGot = command[2];
        const newPathFile = resolve(pathToNewDirectoryGot, './', nameFile);
        copyFile(pathFile, newPathFile, (err) => {
          if (err) {
            console.error(err);
            rl.prompt();
            return;
          }
          unlink(pathFile, (err) => {
            if (err) {
              console.error(err);
              rl.prompt();
              return;
            }
          })
          rl.prompt();
        })

      } catch (error) {
        console.error('Operation failed');
      }
      break;
    }

    case 'rm': {
      try {
        const pathToFileGot = command[1];
        const pathFile = resolve(cwd(), pathToFileGot); console.log('pathFile', pathFile);
        unlink(pathFile, (err) => {
          if (err) {
            console.error(err);
            rl.prompt();
            return;
          }

          rl.prompt();
        })
      } catch (error) {
        console.error('Operation failed');
      }
      break;
    }

    case 'os': {
      try {
        const commandGot = command[1];

        if (commandGot === '--EOL') {
          console.log(JSON.stringify(EOL));
        };

        if (commandGot === '--cpus') {
          const arrCpus = cpus();
          console.log('overall amount of CPUS', arrCpus.length);
          console.log('model', arrCpus[0].model);
          arrCpus.forEach((item, index) => console.log(`clock rate (in GHz) ${index}`, item.speed));
        };

        if (commandGot === '--homedir') {
          console.log('homedir ==', homedir());
        };

        if (commandGot === '--username') {
          console.log(hostname())
        };

        if (commandGot === '--architecture') {
          console.log(arch());
        };
      } catch (error) {
        console.error('Operation failed');
      }
      break;
    }

    case 'hash': {
      try {
        const pathToFileGot = command[1];
        const pathFile = resolve(pathToFileGot);
        readFile(pathFile, 'utf-8', (err, data) => {
          if (err) {
            console.error(err);
            rl.prompt();
            return;
          }
          const hash = createHash('sha256').update(data).digest('hex');
          console.log(hash);
          rl.prompt();
        });
      } catch (error) {
        console.error('Operation failed');
      }
      break;
    }

    case 'compress': {
      try {
        const pathToFileGot = command[1];
        const pathFile = resolve(pathToFileGot);
        const nameFile = basename(pathFile);
        const pathToDestinationGot = command[2];
        const pathToDestination = resolve(pathToDestinationGot, './', `${nameFile}.br`);

        const readStream = createReadStream(pathFile);
        const writeStream = createWriteStream(pathToDestination);

        const brotli = createBrotliCompress();

        readStream.pipe(brotli).pipe(writeStream);

      } catch (error) {
        console.error('Operation failed');
      }
      break;
    }

     case 'decompress': {
      try {
        const pathToFileGot = command[1];
        const pathFile = resolve(pathToFileGot);
        const nameFile = basename(pathFile);
        const nameFileAfterDecompress = nameFile.slice(0, nameFile.length - 3);
        const pathToDestinationGot = command[2];
        const pathToDestination = resolve(pathToDestinationGot, './', `${nameFileAfterDecompress}`); console.log('pathFile', pathFile, '\n', pathToDestination)

        const readStream = createReadStream(pathFile);
        const writeStream = createWriteStream(pathToDestination);

        const brotli = createBrotliDecompress();

        readStream.pipe(brotli).pipe(writeStream);

      } catch (error) {
        console.error('Operation failed');
      }
      break;
     }

    default:
      console.log(`Invalid input`);
      break;
  }
  rl.prompt();
});
rl.on('close', () => {
  console.log(`Thank you for using File Manager, ${userName}!`);
  exit(0);
});