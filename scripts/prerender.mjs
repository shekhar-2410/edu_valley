#!/usr/bin/env node
/**
 * SPA Pre-rendering Script
 * ------------------------
 * Spawns a static HTTP server (sirv) over the existing `dist/` output,
 * uses headless Chrome (puppeteer) to visit each public route, captures
 * the fully-hydrated HTML, and writes it to `dist/<route>/index.html`
 * so search engines see complete content without running JS.
 *
 * Usage:
 *   npm run build      # produce dist/
 *   npm run prerender  # walk routes and overwrite per-route index.html
 *
 * NOTES:
 *   - This script is OPT-IN. It is NOT wired to `postbuild`, so a normal
 *     `npm run build` is unaffected. Run it manually (or wire it into a
 *     deploy pipeline) when prerendered HTML is desired.
 *   - The /thank-you route is rendered for completeness, but robots.txt
 *     already disallows crawling it.
 *   - Backend (API) does NOT need to be running. We block all non-local /
 *     non-font requests so the prerender doesn't hang waiting on APIs.
 *     The hydrated SPA on the client fetches real data after load.
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const PORT = 4173
const ORIGIN = `http://localhost:${PORT}`

const ROUTES = [
    '/',
    '/about',
    '/academics',
    '/admissions',
    '/faculty',
    '/events',
    '/gallery',
    '/resources',
    '/contact',
    '/thank-you',
]

if (!existsSync(DIST)) {
    console.error('[prerender] dist/ does not exist. Run `npm run build` first.')
    process.exit(1)
}

console.log('[prerender] Starting preview server on port', PORT)
const previewProcess = spawn(
    'npx',
    ['sirv', 'dist', '--port', String(PORT), '--single', '--quiet'],
    {
        cwd: ROOT,
        stdio: 'inherit',
        shell: true,
    }
)

// Wait for server to be ready
await new Promise((resolve) => setTimeout(resolve, 2500))

const browser = await puppeteer.launch({ headless: 'new' })
let hadError = false
try {
    for (const route of ROUTES) {
        const url = `${ORIGIN}${route}`
        console.log('[prerender] Rendering', url)
        const page = await browser.newPage()
        // Block external requests so prerender doesn't hang on slow APIs/fonts
        await page.setRequestInterception(true)
        page.on('request', (req) => {
            const reqUrl = req.url()
            // Allow local origin and Google Fonts
            if (
                reqUrl.startsWith(ORIGIN) ||
                reqUrl.includes('fonts.googleapis.com') ||
                reqUrl.includes('fonts.gstatic.com')
            ) {
                req.continue()
            } else {
                req.abort()
            }
        })
        try {
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
        } catch (err) {
            console.warn('[prerender] networkidle0 timed out for', url, '- continuing with current DOM')
        }
        // Wait briefly for Helmet to commit meta to head
        await new Promise((r) => setTimeout(r, 500))
        const html = await page.content()
        const outDir = route === '/' ? DIST : join(DIST, route.replace(/^\//, ''))
        await mkdir(outDir, { recursive: true })
        const outFile = join(outDir, 'index.html')
        await writeFile(outFile, html, 'utf8')
        console.log('[prerender] Wrote', outFile.replace(ROOT, '.'))
        await page.close()
    }
    console.log('[prerender] Done.')
} catch (err) {
    hadError = true
    console.error('[prerender] Failed:', err)
} finally {
    await browser.close()
    previewProcess.kill('SIGTERM')
    // Give it a moment to exit cleanly
    await new Promise((r) => setTimeout(r, 300))
}

process.exit(hadError ? 1 : 0)
