export const threeCover = (texture, aspect) => {
	// image is an actual node element <img>
	// so if we write w, h, we can use it instead of storing node element
	
	var imageAspect = texture.image.width / texture.image.height;

	if (imageAspect > 1) {
		return {
			x: imageAspect,
			y: 1,
		};
	} else {
		return {
			x: imageAspect,
			y: 1,
		};
	}
};
