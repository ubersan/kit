import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

/** @type {import('.')} **/
export default function () {
	return {
		name: '@sveltejs/adapter-vercel',

		async adapt({ utils }) {
			const dir = '.vercel_build_output';
			utils.rimraf(dir);

			const files = fileURLToPath(new URL('./files', import.meta.url));

			const dirs = {
				static: join(dir, 'static'),
				lambda: join(dir, 'functions/node/render')
			};

			// TODO ideally we'd have something like utils.tmpdir('vercel') rather
			// than hardcoding '.svelte-kit/vercel/entry.js'. At the moment we're
			// exposing implementation details that could change
			utils.log.minor('Generating serverless function...');
			utils.copy(join(files, 'entry.js'), '.svelte-kit/vercel/entry.js');

			writeFileSync(join(dirs.lambda, 'package.json'), JSON.stringify({ type: 'commonjs' }));

			utils.log.minor('Prerendering static pages...');
			await utils.prerender({
				dest: dirs.static
			});

			utils.log.minor('Copying assets...');
			utils.copy_static_files(dirs.static);
			utils.copy_client_files(dirs.static);

			utils.log.minor('Writing routes...');
			utils.copy(join(files, 'routes.json'), join(dir, 'config/routes.json'));
		}
	};
}
