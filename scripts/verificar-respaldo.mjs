import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const dir = process.argv[2];
const manifiesto = JSON.parse(await fs.readFile(path.join(dir, 'manifiesto.json'), 'utf8'));

let ok = 0;
let malos = 0;

for (const t of manifiesto.tablas) {
  const texto = await fs.readFile(path.join(dir, `${t.tabla}.json`), 'utf8');
  const hash = crypto.createHash('sha256').update(texto, 'utf8').digest('hex');
  const filas = JSON.parse(texto).length;
  const bien = hash === t.sha256 && filas === t.filas;
  if (bien) ok += 1;
  else {
    malos += 1;
    console.log('MAL', t.tabla, { hash, esperado: t.sha256, filas, esperadas: t.filas });
  }
}

console.log(`verificadas_ok=${ok} con_problema=${malos} total_filas=${manifiesto.totalFilas}`);
process.exitCode = malos === 0 ? 0 : 1;
