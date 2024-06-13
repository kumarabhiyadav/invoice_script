const express = require('express');
const path = require('path');

const app = express();
const port = 4000;

// Serve static files from the current directory
app.use(express.static(path.resolve(__dirname)));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});