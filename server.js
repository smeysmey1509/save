const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// Enable CORS for all routes
app.use(cors());

// Enable JSON body parsing for POST requests
app.use(express.json());

// Define the base path
const BASE_PATH = "/home/admin/Smey/packet-html/";

console.log("hello world");

const getFoldersWithFiles = (dir) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
      if (err) {
        return reject(err);
      }

      const folderPromises = entries.map((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // Recursively get nested folders and files
          return getFoldersWithFiles(fullPath).then((subStructure) => ({
            name: entry.name,
            files: subStructure.files,
            folders: subStructure.folders,
          }));
        } else if (entry.isFile()) {
          return Promise.resolve({ name: entry.name });
        }
        return Promise.resolve(null);
      });

      Promise.all(folderPromises)
        .then((results) => {
          const folders = results.filter((result) => result && result.folders); // Only folders with sub-structure
          const files = results
            .filter((result) => result && !result.folders) // Only files without sub-structure
            .map((file) => file.name); // Extract file names

          resolve({ folders, files });
        })
        .catch(reject);
    });
  });
};

// Helper function to read file content
const readFileContent = (filePath, res) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        reject("Error reading file: " + err.message);
      } else {
        resolve(data);
      }
    });
  });
};

// API endpoint to get folders and files in the specified structure
app.get("/api/v1/getFoldersWithFiles", (req, res) => {
  const srcDirectory = path.join(
    "/",
    "home",
    "admin",
    "Smey",
    "alternative-core-mini"
  ); // Adjust this path as necessary

  getFoldersWithFiles(srcDirectory)
    .then((data) => {
      const projectData = [
        {
          name: "itmgt-gl-f9-gp-itmgt.v1.0-g01-c0001",
          folders: data.folders,
          files: data.files,
        },
      ];
      res.json(projectData);
    })
    .catch((error) => {
      console.error("Error reading folders and files:", error);
      res.status(500).send("Error retrieving folders and files");
    });
});

// Route to read the content of a file dynamically based on folder and file name
app.get("/api/v1/readFile", async (req, res) => {
  const { folder, file } = req.query; // Get folder and file from query parameters

  // Split the folder string to support nested paths (if provided)
  const folderPath = folder ? folder.split("/") : []; // Convert folder path to an array, allowing nested folders

  // Construct the absolute file path dynamically
  const filePath = path.join(
    "/",
    "home",
    "admin",
    "Smey",
    "alternative-core-mini",
    ...folderPath, // Spread the folder path array for nested folder support
    file // Use the file parameter for the file name
  );

  try {
    const data = await readFileContent(filePath, res);
    res.send(data); // Send the file content as response
  } catch (error) {
    res.status(500).send(error); // Return error message if reading file fails
  }
});

// Route to read and search the content of a file dynamically based on folder, file name, and search text
app.get("/api/v1/searching", async (req, res) => {
  const { folder, file, search } = req.query; // Get folder, file, and search text from query parameters

  // Split the folder string to support nested paths (if provided)
  const folderPath = folder ? folder.split("/") : []; // Convert folder path to an array, allowing nested folders

  // Construct the absolute file path dynamically
  const filePath = path.join(
    "/",
    "home",
    "admin",
    "Smey",
    "alternative-core-mini",
    ...folderPath, // Spread the folder path array for nested folder support
    file // Use the file parameter for the file name
  );

  try {
    let data = await readFileContent(filePath, res);

    // If search text is provided, highlight it
    if (search) {
      const searchRegex = new RegExp(search, "gi"); // Case-insensitive search
      data = data.replace(
        searchRegex,
        (match) => `<span style='background-color: red>${match}</span>`
      );
    }

    res.send(data); // Send the modified data with highlighted search term
  } catch (error) {
    res.status(500).send(error);
  }
});

// Route to write data to a file based on folder and file name
app.post("/api/v1/writeFile", (req, res) => {
  const { folder, file, content } = req.body;

  if (!folder || !file || typeof content !== "string") {
    return res.status(400).send("Missing folder, file name, or content");
  }

  // Construct the file path
  const filePath = path.join(
    "/",
    "home",
    "admin",
    "Smey",
    "alternative-core-mini",
    folder,
    file
  );

  console.log("Writing to file at path:", filePath);

  // Write content to the specified file
  fs.writeFile(filePath, content, "utf8", (err) => {
    if (err) {
      console.error("Error writing to file:", err);
      return res.status(500).send("Error writing to file: " + err.message);
    }
    console.log("File written successfully");
    res.send("File written successfully");
  });
});

// Start the server
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
