import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

/**
 * Mobile app update endpoints.
 *
 * To publish a new version:
 * 1. Build APK: `flutter build apk --release`
 * 2. Copy APK to server: `/opt/minasa-server/updates/minasa-X.X.X.apk`
 * 3. Update version.json in the same folder with:
 *    {
 *      "version": "1.0.1",
 *      "versionCode": 2,
 *      "apkFile": "minasa-1.0.1.apk",
 *      "releaseNotes": "تحسينات وإصلاحات",
 *      "mandatory": false,
 *      "releaseDate": "2026-04-14"
 *    }
 */

const UPDATES_DIR = process.env.UPDATES_DIR || path.join(process.cwd(), 'updates')

// Ensure updates directory exists
if (!fs.existsSync(UPDATES_DIR)) {
  try { fs.mkdirSync(UPDATES_DIR, { recursive: true }) } catch (e) {
    console.error('Failed to create updates dir:', e)
  }
}

/**
 * Get latest version info.
 * Public endpoint (no auth required - so app can check before login).
 */
router.get('/version', (_req: Request, res: Response) => {
  try {
    const versionFile = path.join(UPDATES_DIR, 'version.json')

    if (!fs.existsSync(versionFile)) {
      return res.json({
        version: '1.0.0',
        versionCode: 1,
        apkUrl: null,
        releaseNotes: '',
        mandatory: false,
      })
    }

    const data = JSON.parse(fs.readFileSync(versionFile, 'utf-8'))
    const protocol = _req.protocol
    const host = _req.get('host')

    return res.json({
      version: data.version,
      versionCode: data.versionCode || 1,
      apkUrl: data.apkFile
        ? `${protocol}://${host}/api/mobile/download/${data.apkFile}`
        : null,
      releaseNotes: data.releaseNotes || '',
      mandatory: data.mandatory === true,
      releaseDate: data.releaseDate || '',
    })
  } catch (e: any) {
    console.error('[mobile-update] version check failed:', e.message)
    return res.status(500).json({ error: 'فشل التحقق من الإصدار' })
  }
})

/**
 * Download APK file.
 * Streams the file with proper headers for Android install.
 */
router.get('/download/:file', (req: Request, res: Response) => {
  try {
    const file = req.params.file
    // Whitelist allowed filename shape, then resolve and confirm the final
    // path is still inside UPDATES_DIR — absolute paths and crafted segments
    // won't escape the sandbox.
    if (!/^[A-Za-z0-9._-]+\.apk$/.test(file)) {
      return res.status(400).json({ error: 'اسم ملف غير صالح' })
    }
    const updatesRoot = path.resolve(UPDATES_DIR)
    const apkPath = path.resolve(updatesRoot, file)
    if (!apkPath.startsWith(updatesRoot + path.sep) && apkPath !== updatesRoot) {
      return res.status(400).json({ error: 'اسم ملف غير صالح' })
    }
    if (!fs.existsSync(apkPath)) {
      return res.status(404).json({ error: 'الملف غير موجود' })
    }

    const stat = fs.statSync(apkPath)
    res.setHeader('Content-Type', 'application/vnd.android.package-archive')
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`)
    res.setHeader('Cache-Control', 'public, max-age=86400')

    fs.createReadStream(apkPath).pipe(res)
  } catch (e: any) {
    console.error('[mobile-update] download failed:', e.message)
    return res.status(500).json({ error: 'فشل التنزيل' })
  }
})

export default router
