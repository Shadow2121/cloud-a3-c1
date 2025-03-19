const express = require('express');
const fs = require('fs'); 
const axios = require('axios'); 
const path = require('path');

const app = express();
const port = 6000;

app.use(express.json()); // Parse JSON request bodies

const FILE_DIRECTORY = "/mihir_PV_dir";

const fileExists = async (file) => {
  try {
      await fs.access(path.join(FILE_DIRECTORY, file));
      return true;
  } catch {
      return false;
  }
};

fileExists("file.dat").then(exists => console.log("File exists:", exists));

app.post('/store-file', async (req, res) => {
  try {
      const { file, data } = req.body;

      if (!file) {
          return res.status(400).json({ file: null, error: "Invalid JSON input." });
      }
      if (data === undefined || data === null) {
          return res.status(400).json({ file: file, error: "Missing 'data' in JSON input." });
      }

      console.log('Received data:', data);
      const filePath = path.join(FILE_DIRECTORY, file);
      console.log('Attempting to write to file path:', filePath);

      let newData = data?.replaceAll(" ", "") || data;

      fs.writeFile(filePath, newData,(err) => {
        if(err) {
          return res.status(500).json({ file: req.body ? req.body.file : null, error: "Error while storing the file to the storage." });
        }

        return res.status(200).json({ file: file, message: "Success." });
      });

      

  } catch (error) {
      console.error('Error storing file:', error);
      res.status(500).json({ file: req.body ? req.body.file : null, error: "Error while storing the file to the storage." });
  }
});

app.post('/calculate', async (req, res) => {
  try {
    // 1. Validate input JSON
    const { file, product } = req.body;
    if (!file) {
      return res.status(400).json({
        file: file,
        error: "Invalid JSON input."
        });
    }

    const filePath = path.join('/mihir_PV_dir', file);
    if (!fs.existsSync(filePath)) {
        //console.log("File not found.. form console..")
        return res.status(404).json({
          error: "File not found.",
          file: file
        });
      }

      try {
        // Send request to Container 2
        const response = await axios.post('http://c2-service:8000/process', { file, product });
        res.json(response.data);
        console.log(res+"81");
    } catch (error) {
        // Check if the error has a response from the server
        if (error.response) {
            // Server responded with an error status
            return res.status(error.response.status).json(error.response.data);
        } else {
            // Connection error or other issues
            return res.status(500).json({ file, error: 'Internal server error: ' + error.message });
        }
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(error.response?.status || 500).json(error.response?.data || {
      error: "Internal server error."
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});