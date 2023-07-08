import Item from './Item';
import Component from '../../classes/Component';
import GSAP from 'gsap';
import each from 'lodash/each';
import map from 'lodash/map';
import { lerp, clamp } from '../../utils/utils';

export default class Gallery extends Component {
	constructor(isWebpSupported) {
		super({
			element: '.cover__wrapper',
			elements: {
				main: {
					wrapper: '.main__wrapper',
					figure: '.main__figure',
					image: '.main__image',
				},
				thumb: {
					el: '.thumb',
					wrapper: '.thumb__wrapper',
				},
				coverBackground: '.cover__background',
				// thumbItems: '.thumb__item',
			},
		});

		this.isWebpSupported = isWebpSupported;

		this.isLoaded = false;

		this.items = [];

		this.position = 0;
		this.direction = 1;
		this.velocity = 1;

		this.speed = {
			current: 0,
			target: 0,
			lerp: 0.1,
			extra: 0,
		};

		this.mobilemediaQuery = window.matchMedia('(max-width: 1024px)');
		if (this.mobilemediaQuery.matches) this.speed.lerp = 0.35;

		this.y = {
			start: 0,
			end: 0,
		};

		this.isAnimating = false;
		this.isTouchPoint = false;
		this.timer = null;

		this.bounds = this.getBounds();

		// Image related
		this.previousIndex = 0;
		this.activeIndex = 0;

		this.createTimeline();
	}

	createTimeline() {
		// GSAP.set(this.elements.main.figure, { opacity: 0 });
		this.tl = GSAP.timeline({ paused: true });
		let duration = this.mobilemediaQuery.matches ? 0.5 : 1; // Desktop 1.5s

		this.tl.fromTo(
			this.elements.main.figure,
			{
				opacity: 0,
			},
			{
				opacity: 1,
				duration: duration,
			}
		);

		this.tl.fromTo(
			this.elements.coverBackground,
			{
				opacity: 0,
			},
			{
				opacity: 0.18,
				duration: duration,
			}
		);
	}

	fadeIn() {
		this.tl.play();
	}

	fadeOut() {
		this.tl.reverse();
	}

	create(thumbItems) {
		// Called on preloaded
		if (!thumbItems) return;

		this.elements.thumb.items = thumbItems;

		each(this.elements.thumb.items, (item, index) => {
			item.setAttribute('data-index', index);
			const newItem = new Item({
				item: item,
				image: item.querySelector('img'),
				format: this.isWebpSupported ? 'webp' : 'jpg',
			});
			this.items.push(newItem);
		});

		this.bounds = this.getBounds();

		this.reveal();
	}

	reveal() {
		GSAP.fromTo(
			document.querySelector('.loading__icon__container'),
			{
				autoAlpha: 0,
			},
			{ delay: 1, autoAlpha: 1, onComplete: () => (this.isLoaded = true) }
		);
	}

	updateImageSource() {
		this.elements.main.image.src = this.items[this.activeIndex].src;
		this.elements.coverBackground.src = this.items[this.activeIndex].thumbSrc;
	}

	replaceImageSource() {
		this.elements.main.image.src = this.dummyImage.src;
		this.elements.coverBackground.src = this.dummyImageBg.src;
	}

	clickEvent(target) {
		this.isClicked = true;
		const targetIndex = target.getAttribute('data-index');

		if (this.activeIndex === targetIndex) return;

		this.targetPosition =
			-this.items[targetIndex].bounds.left +
			window.innerWidth / 2 -
			this.items[targetIndex].bounds.width / 2;

		this.direction = this.position > this.targetPosition ? -1 : 1;
	}

	changeActive() {
		this.items[this.previousIndex].setInactive();
		this.items[this.activeIndex].setActive();

		this.previousIndex = this.activeIndex;

		this.fadeOut();

		this.updateImageSource();
	}

	getBounds() {
		let totalWidth = 0;
		const padding = 6;

		map(this.items, (item) => {
			item.getBounds();
			totalWidth = totalWidth + (item.bounds.width + padding * 2);
			item.position = totalWidth;
		});

		this.totalWidth = totalWidth;

		return this.element.getBoundingClientRect();
	}

	addEventListeners() {
		this.elements.main.image.addEventListener('load', () => {
			if (!this.isLoaded) return;
			this.fadeIn();
		});

		this.elements.thumb.wrapper.addEventListener('click', (e) => {
			e.preventDefault();
			e.target.classList.contains('thumb__item')
				? this.clickEvent(e.target)
				: this.clickEvent(e.target.closest('.thumb__item'));
		});

		window.addEventListener('keydown', this.onKeyDown.bind(this));
	}

	removeEventListener() {}

	onKeyDown(e) {
		this.isClicked = false;
		if (e.key === 'ArrowLeft' || e.keyCode === 37) {
			if (this.activeIndex > 0) {
				this.activeIndex--;
				this.position += 300;
				this.changeActive();
			}
		}

		if (e.key === 'ArrowRight' || e.keyCode === 38) {
			this.isClicked = false;
			if (this.activeIndex < this.items.length - 1) {
				this.activeIndex++;

				this.position -= 300;
				this.changeActive();
			}
		}
	}
	onWheel({ pixelY }) {
		this.isClicked = false;

		this.direction = pixelY > 0 ? 1 : -1;
		this.velocity += pixelY * 0.1;
		this.speed.target += Math.abs(pixelY * 0.5);

		this.isAnimating = true;
	}

	onTouchDown(e) {
		this.isClicked = false;
		this.isTouch = true;

		this.y.start = e.touches ? e.touches[0].clientX : e.clientX;
	}

	onTouchMove(e) {
		if (!this.isTouch) return;

		const y = e.touches ? e.touches[0].clientX : e.clientX;

		this.y.end = y;

		let yDistance = y - this.y.start;

		if (Math.abs(yDistance) > 2) {
			this.direction = yDistance < 0 ? -1 : 1;
			this.isTouchPoint = true;
			this.speed.target += Math.abs(yDistance);

			this.y.start = y;
		}
	}

	onTouchUp(e) {
		if (!this.isTouch) return;
		this.isTouch = false;
		this.isTouchPoint = false;

		const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

		this.y.end = y;

		const values = {
			y: this.y,
		};
	}

	onResize() {
		this.bounds = this.getBounds();
	}

	update() {
		if (!this.isLoaded) return;

		// console.log(this.imageTransition);
		this.speed.current = lerp(
			this.speed.current,
			this.speed.target,
			this.speed.lerp
		);

		this.speed.target = clamp(this.speed.target, 1, 2000);
		this.speed.current = clamp(this.speed.current, 1, 2000);

		this.speed.target *= 0.5;

		this.position += this.speed.current * this.direction;

		let closestImageIndex;
		let smallestDistance = Infinity;

		map(this.items, (item, index) => {
			let imageCenter = item.bounds.left + item.bounds.width / 2;
			// calculate distance between viewport center and image center
			let distance = Math.abs(
				window.innerWidth / 2 - (imageCenter + this.position)
			);

			if (distance < smallestDistance) {
				smallestDistance = distance;
				closestImageIndex = index;
			}
		});

		if (this.activeIndex !== closestImageIndex) {
			this.activeIndex = closestImageIndex;
			this.changeActive();
		}

		if (!this.isClicked)
			this.targetPosition =
				-this.items[this.activeIndex].bounds.left +
				window.innerWidth / 2 -
				this.items[this.activeIndex].bounds.width / 2;

		this.position = lerp(this.position, this.targetPosition, this.speed.lerp); // you can adjust the 0.1 to control the speed of snapping

		this.elements.thumb.wrapper.style.transform = `translate3d(${this.position}px, 0, 0)`;
	}
}
