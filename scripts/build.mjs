#!/usr/bin/env node
/**
 * Pipeline de build do TibIdle (esbuild).
 *
 *   node scripts/build.mjs               → build de desenvolvimento (sourcemaps)
 *   node scripts/build.mjs --production  → build minificado para empacotamento
 *   node scripts/build.mjs --watch       → watch + (re)inicia o Electron a cada rebuild
 */
import { build, context } from 'esbuild';
import { spawn } from 'node:child_process';
import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (...segments) => path.join(root, ...segments);

const argv = new Set(process.argv.slice(2));
const isWatch = argv.has('--watch');
const isProd = argv.has('--production');

/** @type {import('esbuild').BuildOptions} */
const shared = {
  absWorkingDir: root,
  bundle: true,
  minify: isProd,
  sourcemap: isProd ? false : 'linked',
  legalComments: 'none',
  logLevel: 'info',
};

/** @type {Record<string, import('esbuild').BuildOptions>} */
const targets = {
  main: {
    ...shared,
    entryPoints: [r('src/main/main.ts')],
    outfile: r('dist/main/main.js'),
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    external: ['electron'],
  },
  preload: {
    ...shared,
    entryPoints: [r('src/preload/preload.ts')],
    outfile: r('dist/preload/preload.js'),
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    external: ['electron'],
  },
  renderer: {
    ...shared,
    entryPoints: [
      { in: r('src/renderer/app.ts'), out: 'app' },
      { in: r('src/renderer/styles/main.css'), out: 'styles' },
    ],
    outdir: r('dist/renderer'),
    platform: 'browser',
    format: 'iife',
    target: 'chrome130',
  },
};

async function copyStatic() {
  await mkdir(r('dist/renderer'), { recursive: true });
  await copyFile(r('src/renderer/index.html'), r('dist/renderer/index.html'));
  try {
    await cp(r('src/renderer/assets'), r('dist/renderer/assets'), { recursive: true });
  } catch (err) {
    // se não houver pasta assets, prossegue normalmente
  }
}

async function runBuild() {
  await rm(r('dist'), { recursive: true, force: true });
  await Promise.all(Object.values(targets).map((options) => build(options)));
  await copyStatic();
  console.log(`\n✔ Build ${isProd ? 'de produção' : 'de desenvolvimento'} concluído em dist/`);
}

async function runWatch() {
  await rm(r('dist'), { recursive: true, force: true });

  const electronBinary = createRequire(import.meta.url)('electron');
  const pending = new Set(Object.keys(targets));
  let electron = null;
  let restarting = false;
  let restartTimer;

  const launch = () => {
    electron = spawn(electronBinary, ['.'], { cwd: root, stdio: 'inherit' });
    electron.on('exit', (code) => {
      if (!restarting) process.exit(code ?? 0);
    });
  };

  const scheduleRestart = () => {
    clearTimeout(restartTimer);
    restartTimer = setTimeout(() => {
      if (!electron) {
        launch();
        return;
      }
      restarting = true;
      electron.removeAllListeners('exit');
      electron.on('exit', () => {
        restarting = false;
        launch();
      });
      electron.kill();
    }, 200);
  };

  const plugins = (name) => [
    {
      name: `watch-${name}`,
      setup(buildContext) {
        buildContext.onEnd(async (result) => {
          if (result.errors.length > 0) return;
          if (name === 'renderer') {
            await copyStatic();
          }
          pending.delete(name);
          if (pending.size === 0) {
            scheduleRestart();
          }
        });
      },
    },
  ];

  await Promise.all(
    Object.entries(targets).map(async ([name, options]) => {
      const ctx = await context({
        ...options,
        plugins: [...(options.plugins ?? []), ...plugins(name)],
      });
      await ctx.watch();
    }),
  );

  console.log('👀 Modo watch ativo para TibIdle (recarregando a cada alteração)...');
}

if (isWatch) {
  runWatch().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  runBuild().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
