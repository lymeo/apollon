const fs = require("fs");

module.exports = {

    storeFileOnFs(stream, path) {
        return new Promise((resolve, reject) =>
          stream
            .on('error', error => {
              if (stream.truncated)
                // Delete the truncated file
                fs.unlinkSync(path)
              reject(error)
            })
            .pipe(fs.createWriteStream(path))
            .on('error', error => reject(error))
            .on('finish', () => resolve())
        )
      }
}