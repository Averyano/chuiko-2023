// Function is used to get the aspect ratio of the texture.
// It returns an { x: Number, y: Number } object, which can be used on UVs to map the texture
// Similar to what object-fit: cover does in CSS, but for GLSL shaders

export const threeCover = (texture, aspect) => {
	var imageAspect = texture.image.width / texture.image.height;

	if (imageAspect > aspect) {
		return {
			x: imageAspect / aspect,
			y: 1,
		};
	} else {
		return {
			x: 1,
			y: aspect / imageAspect,
		};
	}
};
