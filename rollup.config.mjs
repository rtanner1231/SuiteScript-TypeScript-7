import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import { globSync } from 'glob';
import path from 'path';

/**
 * By default, rollup will place the SuiteScript JSDoc tag within the define function.
 * This function is used to hoist it to the top of the file.
 */
function hoistNetSuiteJSDoc() {
    return {
        name: 'hoist-netsuite-jsdoc',
        renderChunk(code) {
            const jsdocRegex = /([ \t]*\/\*\*[\s\S]*?@NApiVersion[\s\S]*?\*\/)/;
            const match = code.match(jsdocRegex);

            if (match) {
                let jsdoc = match[0].trim();

                //normalize indentation
                jsdoc = jsdoc.replace(/^[ \t]+\*/gm, ' *');

                const newCode = code.replace(match[0], '');
                return jsdoc + '\n\n' + newCode;
            }

            return null;
        }
    };
}

export default {
    input: globSync('build/**/*.js').map(file => file.replace(/\\/g, '/')),

    external: [/^[N]\//],

    output: {
        dir: 'dist/FileCabinet/SuiteScripts',
        format: 'amd',
        preserveModules: true,
        preserveModulesRoot: 'build',
        exports: 'auto',
        //we do not need interop boilderplate added for Netsuite modules
        interop: (id) => {
            if (id && id.startsWith('N/')) {
                return 'esModule';
            }
            return 'auto'
        }
    },

    plugins: [
        alias({
            entries: [
                { find: 'SuiteScripts', replacement: path.resolve('build') }
            ]
        }),
        resolve(),
        commonjs(),
        hoistNetSuiteJSDoc()
    ]
};
