import path from 'node:path'

export const EXTERNAL_TYPES = [
  'css',
  "less",
  "sass",
  "scss",
  "styl",
  "stylus",
  "pcss",
  "postcss",
  "vue",
  "svelte",
  "marko",
  "astro",
  "png",
  "jpe?g",
  "gif",
  "svg",
  "ico",
  "webp",
  "avif",
]
export const BARE_IMPORT_RE = /^[\w@][^:]/

export const PRE_BUNDLE_DIR = path.join('node_modules', '.mini-vite')

export const JS_TYPES_RE = /\.(?:j|t)sx?$|\.mjs$/;
export const QEURY_RE = /\?.*$/s;
export const HASH_RE = /#.*$/s;

export const DEFAULT_EXTENSIONS = ['.tsx', 'ts', '.jsx', '.js']

export const HMR_PORT = 24678

export const CLIENT_PUBLIC_PATH = '/@vite/client'

/**
 * Prefix for resolved fs paths, since windows paths may not be valid as URLs.
 */
export const FS_PREFIX = `/@fs/`

/**
 * Prefix for resolved Ids that are not valid browser import specifiers
 */
export const VALID_ID_PREFIX = `/@id/`

export const ENV_PUBLIC_PATH = `/@vite/env`
