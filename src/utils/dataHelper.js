// helpers/cloudinaryHelper.js
const multer       = require('multer');
const cloudinary   = require('./cloudinary');
const streamifier  = require('streamifier');     
const path = require('path');
const { v4: uuidv4 } = require('uuid');



// Protected “defaults” list ———
const protectedIds = [
  'profile-pictures/0a4dbfba-6ba4-4b68-8932-4ee01288a753_1752285697041_default',
  'book-covers/d8358cf2-ef7b-47a2-abec-27e5aaadd827_1752218741435_default-cover',
  'articles-pictures/53c69df0-f619-4535-842e-f61297be4a95_1752218554391_default',
  'news-pictures/375a1087-f459-4644-815c-cd152ad465ae_1752231620305_default'
];

// deleteFile by public_id ———
exports.deleteFile = (publicId, callback) => {
  if (!publicId || protectedIds.includes(publicId)) {
    // signal “done” immediately
    return callback(null, { skipped: true });
  }
  cloudinary.uploader.destroy(publicId, (err, result) => {
    callback(err, result);
  });
};

// Multer setup: in‑memory storage + filter/limits ———
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits:   { fileSize: 5_000_000 },      // 5MB
  fileFilter(req, file, cb) {
    const types = /jpeg|jpg|png|gif/;
    const okExt  = types.test(require('path').extname(file.originalname).toLowerCase());
    const okMime = types.test(file.mimetype);
    if (okExt && okMime) {
      req.isImageUploadSuccesful = true;
      cb(null, true);
    } else {
      cb(new Error('Error: Images only! (jpeg, jpg, png, gif)'));
    }
  }
}).single('uploadedImage');

// Combined middleware: multer → Cloudinary upload → next() ———
exports.upload = (req, res, next) => {
  uploadMemory(req, res, (multerErr) => {
    if (multerErr) return next(multerErr);
    if (!req.file) return next(); // no file to upload

    // decide folder and public_id
    let folder = 'book-covers';
    if (req.body._comesFrom === 'profilePicture')  folder = 'profile-pictures';
    else if (req.body._comesFrom === 'newsPicture') folder = 'news-pictures';
    else if (req.body._comesFrom === 'articleCovers') folder = 'articles-pictures';

    // Remove extension from original name
    const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));

    // Build a clean public_id—no folders, no “.png”
    const publicId = `${uuidv4()}_${Date.now()}_${baseName}`;

    // stream buffer into Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'image' },
      (err, result) => {
        if (err) return next(err);
        // attach Cloudinary details for downstream handlers
        req.fileUrl    = result.secure_url;
        req.public_id  = result.public_id;
        req.fileType   = result.resource_type;
        next();
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  });
};
