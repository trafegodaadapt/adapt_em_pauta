import {build} from 'esbuild';import {copyFile,writeFile,readFile} from 'node:fs/promises';
await build({entryPoints:['src/central.js','src/participar.js'],outdir:'public/assets',bundle:true,format:'esm',target:['es2022'],minify:true,legalComments:'eof'});
await writeFile('public/assets/central.css',(await readFile('src/styles.css','utf8'))+'\n'+(await readFile('src/dashboard.css','utf8'))+'\n'+(await readFile('src/themes.css','utf8'))+'\n'+(await readFile('src/public-ui.css','utf8')));
const license=await readFile('node_modules/@supabase/supabase-js/LICENSE','utf8');
await writeFile('public/assets/SUPABASE-LICENSE.txt',license);
console.log('Central e participação compiladas. Nenhum segredo incluído.');
