// Resolves the "@/..." alias (used by Vite) when running domain code with plain Node.
import {pathToFileURL, fileURLToPath} from 'node:url';
import path from 'node:path';

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

export async function resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) return nextResolve(pathToFileURL(path.join(src, specifier.slice(2))).href, context);
    return nextResolve(specifier, context);
}
