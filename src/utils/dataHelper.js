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
    cb(null, file.fieldname + path.extname(file.originalname));
  }
});

// Initialize upload variable with the defined storage engine
const u = multer({
  storage: storage,
  limits: { fileSize: 5000000 },  // Limit file size to 1MB (optional)
  fileFilter: function(req, file, cb) {
    // Accept image files only
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
}).single('coverImage'); // 'image' is the name attribute from the form input

exports.upload = (req, res, next) => {
  u(req, res, function (err) {
    if (err) {
      // Handle any errors during file upload
      return res.status(400).send(err);
    }
    if (!req.file) {
      return res.status(400).send('Error: No File Selected!');
    }
  });

  req.isCoverImageUploadSuccesful = true;
  console.log('\n\ndatahelper\n', req.body,'\n\n');
  
  next();
}
