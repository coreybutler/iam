import buble from 'rollup-plugin-buble'
import { uglify } from 'rollup-plugin-uglify'
import { terser } from 'rollup-plugin-terser'
import replace from 'rollup-plugin-replace'
import stripCode from  'rollup-plugin-strip-code'
import pkg from './package.json'
import path from 'path'
import fs from 'fs-extra'

const input = 'src/main.js'
const outdir = './dist'
const standard = `/standard`
const legacy = `/legacy`
const NODEONLY = {
	start_comment: 'browser-only',
	end_comment: 'end-browser-only'
}
const BROWSERONLY = {
	start_comment: 'node-only',
	end_comment: 'end-node-only'
}
const NON_ESM_ONLY = {
	start_comment: 'non-esm-only',
	end_comment: 'end-non-esm-only'
}

const output = (file, browser = true, sourcemap = true) => {
	let filepath = path.join(outdir, typeof browser === 'string' ? standard : (browser ? legacy : '/node'), file)

	if (browser === 'esm') {
		let re = new RegExp('(\.min)?' + path.extname(filepath).replace('.', '\.'), 'i')
		let token = re.exec(filepath)[0]
		filepath = filepath.replace(token, `.esm${token}`)
	}

	return [{
		file: filepath,
		format: typeof browser === 'string' ? 'esm' : (browser ? 'iife' : 'cjs'),
		name: pkg.name,
		sourcemap
	}]
}

// Remove any prior builds
fs.removeSync(path.resolve(outdir))

export default [
	// Standard (Minified ES6)
	{
		input,
		plugins: [
			stripCode(BROWSERONLY),
			replace({
				delimiters: ['<#', '#>'],
				REPLACE_VERSION: require('./package.json').version
			}),
			terser()
		],
		output: output('iam.min.js', 'esm').concat(output('iam.min.js', 'browser'))
	}, {
		input,
		plugins: [
			stripCode(BROWSERONLY),
			stripCode(NON_ESM_ONLY),
			replace({
				delimiters: ['<#', '#>'],
				REPLACE_VERSION: require('./package.json').version
			}),
			terser()
		],
		output: output('iam.min.js', 'browser')
	}, {
		input,
		plugins: [
			stripCode(NODEONLY),
			stripCode(NON_ESM_ONLY),
			replace({
				delimiters: ['<#', '#>'],
				REPLACE_VERSION: require('./package.json').version
			}),
			terser()
		],
		output: output('index.js', false)
	},

	// Legacy (Transpiled & Minified ES5)
	// This is only relevant to browsers.
	{
		input,
		plugins: [
			stripCode(BROWSERONLY),
			stripCode(NON_ESM_ONLY),
			replace({
				delimiters: ['<#', '#>'],
				REPLACE_VERSION: require('./package.json').version
			}),
			buble(),
			uglify()
		],
		output: output('iam.min.js')
	},

	// Development: Standard (Unminified ES6)
	{
		input,
		plugins: [
			stripCode(BROWSERONLY),
			replace({
				delimiters: ['<#', '#>'],
				REPLACE_VERSION: require('./package.json').version
			})
		],
		output: output('ngn.js', 'esm')
	}, {
		input,
		plugins: [
			stripCode(BROWSERONLY),
			stripCode(NON_ESM_ONLY),
			replace({
				delimiters: ['<#', '#>'],
				REPLACE_VERSION: require('./package.json').version
			})
		],
		output: output('iam.js', 'browser')
	}, {
		input,
		plugins: [
			stripCode(NODEONLY),
			stripCode(NON_ESM_ONLY),
			replace({
				delimiters: ['<#', '#>'],
				REPLACE_VERSION: require('./package.json').version
			})
		],
		output: output('debug.js', false)
	},

	// Development: Legacy (Transpiled & Unminified ES5)
	// This is only relevant to browsers.
	{
		input,
		plugins: [
			stripCode(BROWSERONLY),
			stripCode(NON_ESM_ONLY),
			replace({
				delimiters: ['<#', '#>'],
				REPLACE_VERSION: require('./package.json').version
			})
		],
		output: output('iam.js')
	}
]

// Add package.json, etc. Make sure only newer versions of node are supported.
let distPkg = {
	name: pkg.name,
	version: pkg.version,
	description: pkg.description || '',
	repository: pkg.repository || '',
	keywords: pkg.keywords || [],
	author: pkg.author || 'Author.io',
	contributors: pkg.contributors || [],
	license: pkg.license,
	homepage: pkg.homepage || `https://www.npmjs.org/package/${pkg.name}`,
	engines: pkg.engines || {
		node: ">=8.0.0"
	}
}

if (pkg.hasOwnProperty('private')) {
	distPkg.private = pkg.private
}

if (pkg.hasOwnProperty('bugs')) {
	distPkg.bugs = pkg.bugs
}

fs.ensureDirSync(path.join(outdir, 'node'))
fs.writeFileSync(path.join(outdir, 'node', 'package.json'), JSON.stringify(distPkg))
fs.writeFileSync(path.join(outdir, 'node', 'README'), `See ${pkg.homepage || 'https://www.npmjs.org/package/' + pkg.name}.`)
fs.copySync(path.join(process.cwd(), 'LICENSE'), path.join(outdir, 'node', 'LICENSE'))
