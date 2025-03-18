const express = require("express");
const path = require("path");

const app = express();

// Serve static files from the "public" folder.
// Place your index.html, main.js, and other assets in a folder named "public".
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
