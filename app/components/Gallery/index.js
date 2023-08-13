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
					loadingIcon: '.loading__icon__container',
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

		this.speed = {
			current: 0,
			target: 0,
			lerp: 0.1,
			extra: 0,
		};

		this.mobilemediaQuery = window.matchMedia('(max-width: 1024px)');
		if (this.mobilemediaQuery.matches) this.speed.lerp = 0.35;

		// Touch related
		this.x = {
			start: 0,
			end: 0,
		};

		this.time = {
			start: 0,
			end: 0,
		};

		// Bounds
		this.bounds = this.getBounds();

		// Image related
		this.previousIndex = 0;
		this.activeIndex = 1;

		// Fade animation
		this.createTimeline();
	}

	createTimeline() {
		this.tl = GSAP.timeline({ paused: true });
		let duration = this.mobilemediaQuery.matches ? 0.5 : 1; // Desktop 1s, Mobile 0.5s

		this.tl.fromTo(
			this.elements.main.loadingIcon,
			{ autoAlpha: 1 },
			{ autoAlpha: 0, duration: 0.3 }
		);

		GSAP.set(this.elements.main.loadingIcon, { autoAlpha: 0 });

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
		// create() is called on preloaded
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
			{
				delay: 1,
				autoAlpha: 1,
				onComplete: () => {
					this.isLoaded = true;
					this.fadeIn();
				},
			}
		);
	}

	updateImageSource() {
		this.elements.main.image.src = this.items[this.activeIndex].src;
		this.elements.coverBackground.src = this.items[this.activeIndex].thumbSrc;
	}

	clickEvent(target) {
		this.isClicked = true;
		const targetIndex = target.getAttribute('data-index');
		this.switchTarget(targetIndex);
	}

	switchTarget(targetIndex) {
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
		this.speed.target += Math.abs(pixelY);
	}

	onTouchDown(e) {
		this.isClicked = false;
		this.isTouch = true;

		this.time.start = Date.now();
		this.x.start = e.touches ? e.touches[0].clientX : e.clientX;
		this.speed.extra = 0;
	}

	onTouchMove(e) {
		if (!this.isTouch) return;

		const x = e.touches ? e.touches[0].clientX : e.clientX;

		this.distance = x - this.x.start;

		if (Math.abs(this.distance) > 2) {
			this.direction = this.distance < 0 ? -1 : 1;
			this.speed.extra = Math.min(Math.abs(this.distance), 30);
		}
	}

	onTouchUp(e) {
		if (!this.isTouch) return;
		this.isTouch = false;

		const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;

		this.x.end = x;
		this.time.end = Date.now();

		if (
			this.time.end - this.time.start < 300 &&
			this.time.end - this.time.start > 50
		) {
			this.isClicked = true;
			this.switchTarget(Math.max(0, this.activeIndex - this.direction));
		}

		this.speed.extra = 0;
	}

	onResize() {
		this.bounds = this.getBounds();
	}

	findClosestItem() {
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
	}

	update() {
		if (!this.isLoaded) return;

		this.speed.target += this.speed.extra;
		this.speed.target *= 0.5;

		this.speed.current = lerp(
			this.speed.current,
			this.speed.target,
			this.speed.lerp
		);

		this.speed.target = clamp(this.speed.target, 1, 2000);
		this.speed.current = clamp(this.speed.current, 1, 2000);

		this.position += this.speed.current * this.direction;

		// center the position by the closest item
		this.findClosestItem();

		// if click/swipe event
		if (!this.isClicked)
			this.targetPosition =
				-this.items[this.activeIndex].bounds.left +
				window.innerWidth / 2 -
				this.items[this.activeIndex].bounds.width / 2;

		this.position = lerp(this.position, this.targetPosition, this.speed.lerp);

		this.elements.thumb.wrapper.style.transform = `translate3d(${this.position}px, 0, 0)`;
	}
}
