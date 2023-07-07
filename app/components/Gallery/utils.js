export const modifyImagePath = (path) => {
	// Replaces '/thumbnail/' with '/x1/' in the path
	let newPath = path.replace('/thumbnail/', '/1x/');

	// Creates a regular expression that matches '-thumbnail' followed by '.jpg'
	const re = new RegExp('-thumbnail(.jpg)', 'g');

	// Uses the regular expression to replace '-thumbnail.jpg' with '.jpg' in the newPath
	newPath = newPath.replace(re, '$1');

	return newPath;
};
