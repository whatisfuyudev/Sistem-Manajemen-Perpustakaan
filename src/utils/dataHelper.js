// handle file uploads
const multer  = require('multer');
const path = require('path');

// Configure storage for Multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Files will be saved in the 'uploads' directory
    cb(null, path.join(__dirname, '../../public/images/'));
  },
  filename: function(req, file, cb) {
    // Generate a unique file name with original extension
    cb(null, file.originalname);
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
      req.isCoverImageUploadSuccesful = true;

      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
}).single('coverImage'); // 'image' is the name attribute from the form input

exports.deleteOldCoverImage = async (oldCoverImagePath) => {
  // Delete the old cover image from the file system
  const oldImagePath = path.join(__dirname, '../../public', oldCoverImagePath);
  fs.unlink(oldImagePath, (err) => {
    if (err) {
      console.error('Error deleting old cover image:', err);
    }
  });
}