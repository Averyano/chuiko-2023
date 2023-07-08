import Component from '../../classes/Component';
import { modifyImagePath } from './utils';

export default class Item extends Component {
	constructor({ item, image, format }) {
		super({
			element: item,
			elements: {
				image: image,
				overlay: '.thumb__overlay',
			},
		});

		this.bounds = this.getBounds();
		this.thumbSrc = this.elements.image.getAttribute('src');

		this.src = modifyImagePath(this.thumbSrc, format);
	}

	create() {}

	getBounds() {
		return this.element.getBoundingClientRect();
	}

	setActive() {
		this.element.classList.add('active');
		this.elements.overlay.classList.add('active');
	}

	setInactive() {
		this.element.classList.remove('active');
		this.elements.overlay.classList.remove('active');
	}

	destroy() {}
}
