// // handle file uploads
// const multer  = require('multer');
// const path = require('path');
// const fs = require('fs');
// const cloudinary = require('./cloudinary');



// exports.deleteFile = (filename, callback) => {
//   // if no file to delete, don't delete anything
//   if (!filename) {
//     return null;
//   }

//   // Don’t delete the shared default images
//   const protectedFiles = [
//     '/public/images/profile-pictures/default.jpg',
//     '/public/images/book-covers/default-cover.jpg',
//     '/public/images/articles-pictures/default.png',
//     '/public/images/news-pictures/default.png'
//   ];
//   if (protectedFiles.includes(filename)) {
    
//     return null;
//   }

//   // Construct the file path based on a safe base directory
//   const baseDir = path.join(__dirname, '../../');
//   const fileToDelete = path.join(baseDir, filename);

//   // Validate that fileToDelete is within baseDir.
//   const relative = path.relative(baseDir, fileToDelete);
//   if (relative.startsWith('..') || path.isAbsolute(relative)) {
//     return callback(new Error('Invalid file path: File is outside the allowed directory.'));
//   }

//   fs.unlink(fileToDelete, (err) => {
//     callback(err);
//   });
// };

// // Configure storage for Multer
// const storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     // Files will be saved in the 'public/images/' directory
//     let target = '../../public/images/';
    
//     // if upload from user profile picture api (the front end tells)
//     // modify request object, make new property that tells that
//     // else default to book-covers directory
//     if (req.body._comesFrom === "profilePicture") {
//       target += 'profile-pictures/';
//     } else if (req.body._comesFrom === "newsPicture") {
//       target += 'news-pictures';
//     } else if (req.body._comesFrom === "articleCovers") {
//       target += 'articles-pictures';
//     } else {
//       target += 'book-covers/';
//     }

//     cb(null, path.join(__dirname, target));
//   },
//   filename: function(req, file, cb) {
//     // Generate a name with the file original name plus uuid
//     const finalFileName = uuidv4() +"-"+ file.originalname;

//     cb(null, finalFileName);
//     // cb(null, file.originalname);
//   }
// });

// // Initialize upload variable with the defined storage engine
// exports.upload = multer({
//   storage: storage,
//   limits: { fileSize: 5000000 },  // Limit file size to 5MB (optional)
//   fileFilter: function(req, file, cb) {
//     // Accept image files only
//     const filetypes = /jpeg|jpg|png|gif/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);
//     if (mimetype && extname) {
//       req.isImageUploadSuccesful = true;

//       return cb(null, true);
//     } else {
//       cb('Error: Images Only! (jpeg, jpg, png, gif)');
//     }
//   }
// }).single('uploadedImage'); // 'uploadedImage' is the name attribute from the form input

// helpers/cloudinaryHelper.js
const multer       = require('multer');
const cloudinary   = require('./cloudinary');
const streamifier  = require('streamifier');     
const path = require('path');
const { v4: uuidv4 } = require('uuid');



// Protected “defaults” list ———
const protectedIds = [
  '/public/images/profile-pictures/default.jpg',
  '/public/images/book-covers/default-cover.jpg',
  '/public/images/articles-pictures/default.png',
  '/public/images/news-pictures/default.png'
];

// deleteFile by public_id ———
exports.deleteFile = (publicId, callback) => {
  if (!publicId || protectedIds.includes(publicId)) {
    return null;
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
