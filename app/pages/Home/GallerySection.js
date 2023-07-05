import Component from '../../classes/Component';
import each from 'lodash/each';

export default class GallerySection extends Component {
	constructor() {
		super({
			element: '.gallery',
			elements: {
				images: '.gallery__image',
			},
		});
	}

	getBounds() {
		return new Promise((resolve) => {
			// Create Images Array
			if (!this.imagesArray) {
				this.imagesArray = new Array(this.elements.images.length);
				each(
					this.elements.images,
					(image, i) =>
						(this.imagesArray[i] = {
							bounds: image.getBoundingClientRect(),
							src: image.src,
						})
				);
			}

			// Update Existing Images Array
			if (this.imagesArray) {
				this.imagesArray.map(
					(image, i) =>
						(image.bounds = this.elements.images[i].getBoundingClientRect())
				);
			}

			// Return bounds to GallerySection.js -> app.js -> Experience.js
			resolve(this.imagesArray);
		});
	}
}
