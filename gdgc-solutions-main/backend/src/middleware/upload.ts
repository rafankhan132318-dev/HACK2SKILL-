import multer from 'multer'

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '100')

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mpeg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`))
    }
  },
})
