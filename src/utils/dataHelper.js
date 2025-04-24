// handle file uploads
const multer  = require('multer');
const path = require('path');
const fs = require('fs');

const { v4: uuidv4 } = require('uuid');

exports.deleteFile = (filename, callback) => {
  // if no file to delete, don't delete anything
  if (!filename) {
    return null;
  }

  // Don’t delete the shared default images
  const protectedFiles = [
    '/public/images/profile-pictures/default.jpg',
    '/public/images/book-covers/default-cover.jpg'
  ];
  if (protectedFiles.includes(filename)) {
    return null;
  }

  // Construct the file path based on a safe base directory
  const baseDir = path.join(__dirname, '../../');
  const fileToDelete = path.join(baseDir, filename);

  // Validate that fileToDelete is within baseDir.
  const relative = path.relative(baseDir, fileToDelete);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return callback(new Error('Invalid file path: File is outside the allowed directory.'));
  }

  fs.unlink(fileToDelete, (err) => {
    callback(err);
  });
};

// Configure storage for Multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Files will be saved in the 'public/images/' directory
    let target = '../../public/images/';
    
    if (req.body._comesFrom === "profilePicture") {
      target += 'profile-pictures/';
    } else {
      target += 'book-covers/';
    }

    // if upload from user profile picture api (the front end tells)
    // modify request object, make new property that tells that
    // else default to book-covers directory

    cb(null, path.join(__dirname, target));
  },
  filename: function(req, file, cb) {
    // Generate a name with the file original name plus uuid
    cb(null, uuidv4() + file.originalname);
  }
});

// Initialize upload variable with the defined storage engine
exports.upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 },  // Limit file size to 5MB (optional)
  fileFilter: function(req, file, cb) {
    // Accept image files only
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      req.isImageUploadSuccesful = true;

      return cb(null, true);
    } else {
      cb('Error: Images Only! (jpeg, jpg, png, gif)');
    }
  }
}).single('uploadedImage'); // 'uploadedImage' is the name attribute from the form input

