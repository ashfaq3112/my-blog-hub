const multer = require('multer')
const crypto = require('crypto')
const path = require('path')

//disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads') // specify the directory to save uploaded files
  },
  filename: function (req, file, cb) {
    // create a uinique name for the file
    crypto.randomBytes(16, (err, buffer) => {
        const fn =buffer.toString("hex")+ path.extname(file.originalname);//it adds extension of the original file
        cb(null, fn)
    
  })
}
})


const upload = multer({ storage: storage })

module.exports= upload