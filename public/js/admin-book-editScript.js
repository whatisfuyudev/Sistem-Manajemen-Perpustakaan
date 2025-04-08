// When the cover image (wrapped in a label) is clicked, trigger the file upload
document.getElementById('coverUpload').addEventListener('change', function(){
  // Optionally, you can preview the new cover image here
  const file = this.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = function(e){
      document.getElementById('bookCoverImage').src = e.target.result;
    }
    reader.readAsDataURL(file);
  }
});

// Cancel button: redirect back to the book details page
document.getElementById('cancelButton').addEventListener('click', function() {
  history.back();
});