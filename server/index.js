const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const app = express();
const port = 4001;
const archiver = require("archiver");
const { spawn } = require("child_process");
const cors = require("cors");
const Datastore = require("nedb");
const db = new Datastore({ filename: "database.db", autoload: true, timestampData:true });

// Middleware to handle file uploads
app.use(fileUpload());

app.use(cors("*"));

// Create an uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Route to handle file uploads
app.post("/upload", (req, res) => {
  let { companyName, companyAddress,companyEmail, selectedState,gstNo, panNo } = req.body;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  let uploadedFile = req.files.file;
  const timestamp = Date.now();
  const originalName = path.parse(uploadedFile.name).name;
  const extension = path.extname(uploadedFile.name);
  const newFilename = `${originalName}-${timestamp}${extension}`;

  db.insert({
    companyAddress,
    companyName,
    companyEmail,
    selectedState,
    gstNo,
    panNo,
    file: newFilename,
    status: "Pending",
    result: "",
  });

  uploadedFile.mv(`./uploads/${newFilename}`, function (err) {
    if (err) return res.status(500).send(err);
    res.json({ message: "File uploaded successfully!", filename: newFilename });
  });
});

// Route to process the uploaded file
app.get("/process/:filename", (req, res) => {
  let fileName = req.params.filename;
  console.log(fileName);
  db.update(
    { file: fileName },
    {
      $set: { status: "processing" },
    }
  );

  db.findOne({ file: fileName }, (err, doc) => {
    if (err) {
      console.error("Error finding documents:", err);
    } else {
      console.log("Found documents:", doc);
      const childProcess = spawn(
        "node",
        [
          "cli.js",
          "uploads/" + fileName,
          doc.companyName,
          doc.companyAddress,
          doc.companyEmail,
          doc.selectedState,
          doc.gstNo,
          doc.panNo,
        ],
        {
          detached: true,
          stdio: "ignore", // Ignore stdin, stdout, stderr
        }
      );
      // childProcess.unref();
      childProcess.on("exit", () => {
        console.log(childProcess);
        const code = childProcess.exitCode;
        let result = "";

        if (code === 0) {
          result = "Success";
          db.update(
            { file: fileName },
            {
              $set: { status: "done", result: "success" },
            }
          );
        } else {
          db.update(
            { file: fileName },
            {
              $set: { status: "done", result: "failed" },
            }
          );
        }
        let dbData = db.find();
        console.log(dbData);
      });
    }
  });

  res.send("CLI script started successfully.");
});

app.get("/download/:pdf", (req, res) => {
  const folderPath = "outputInvoices/" + req.params.pdf; // Path to the folder you want to check

  console.log(folderPath);
  fs.access(folderPath, fs.constants.F_OK, (err) => {
    if (err) {
      // Folder does not exist
      res.send("Folder does not exist.");
    } else {
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Maximum compression
      });
      archive.directory(folderPath, false);

      // Set the HTTP response headers for downloading the ZIP file
      res.attachment(`${req.params.pdf}.zip`);
      archive.pipe(res);

      // Finalize the archive and send it to the client
      archive.finalize();
    }
  });
});

app.get("/status", (req, res) => {
  db.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
    if (err) {
        res.status(500).send(err);
    } else {
        res.status(200).send(docs);
    }
});

});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
