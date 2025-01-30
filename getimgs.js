const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');

// Directory containing the images
const imagesDir = path.join(__dirname, 'shared', 'images', '1x')

// Path to the JSON file
const jsonFilePath = path.join(__dirname, 'data', 'gallery.json')

// Read the JSON file
let jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

console.log(jsonData);
// Function to get image files from the directory
function getImageFiles(dir) {
    return fs.readdirSync(dir).filter(file => {
        return ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase());
    });
}

// Get image files
const imageFiles = getImageFiles(imagesDir);

// Process each image file
imageFiles.forEach(file => {
    const filePath = path.join(imagesDir, file);
    const dimensions = sizeOf(filePath);

    const imageObject = {
        src: `/images/thumbnail/${file}`,
        title: '',
        subtitle: '',
        description: '',
        width: dimensions.width,
        height: dimensions.height
    };

    jsonData.home.gallery.images.push(imageObject);
});

// Write the updated JSON back to the file
fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf8');

console.log('Images added to JSON file successfully.');