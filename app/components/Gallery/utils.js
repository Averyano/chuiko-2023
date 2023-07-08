export const modifyImagePath = (path, format = 'jpg') => {
	// Replaces '/thumbnail/' with '/x1/' in the path
	let newPath = path.replace('/thumbnail/', '/1x/');

	// Creates a regular expression that matches '-thumbnail' followed by the provided format
	const re = new RegExp(`-thumbnail(\\.${format})`, 'g');

	// Uses the regular expression to replace '-thumbnail' with the format in the newPath
	newPath = newPath.replace(re, `.${format}`);

	return newPath;
};
