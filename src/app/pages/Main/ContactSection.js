import Component from '../../classes/Component';
import NodeEmitter from '../../classes/NodeEmitter';
import Reveal from '../../animations/Reveal';
import each from 'lodash/each';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { insertAfter } from '../../utils/utils';
import GSAP from 'gsap';
import axios from 'axios';

export default class ContactSection extends Component {
	constructor() {
		super({
			element: '.contact',
			elements: {
				form: {
					el: '.contact__form__wrapper',
					container: '.contact__form__container',
					textInputs: 'input[type="text"]',
					radioInputs: 'input[type="radio"]',
					button: '.contact__form__button',
					buttonText: '.contact__form__button__text',
					labels: '.list li label',

					details: '.contact__select__details',
					detailsParentElement: '.contact__form__group--select',
					icons: {
						wrapper: '.contact__form__button__icon',
						arrow: '.contact__form__button__icon--arrow',
						loading: '.contact__form__button__icon--loading',
						check: '.contact__form__button__icon--checkmark',
						cross: '.contact__form__button__icon--cross',
					},
				},
			},
		});
		this.isSending = false;
		this.contactEmail = 'hello@utkina-design.com';

		this.submitFormBound = this.submitForm.bind(this);
		this.handleClickBound = this.createNewRequest.bind(this);
		this.handleMouseEnterBound = this.activateButton.bind(this);
		this.handleMouseLeaveBound = this.deactivateButton.bind(this);
	}

	create() {
		super.createComponent();
		this.createTimeline();

		this.addEventListeners();
	}

	createTimeline() {
		this.timeline = GSAP.timeline({
			scrollTrigger: {
				trigger: '.expertise__top',
				start: 'top bottom',
				end: 'top bottom',
				toggleActions: 'restart none none reverse',
				// markers: true,
			},
		});

		ScrollTrigger.create({
			trigger: this.element,
			start: 'top center',
			end: 'bottom bottom',
			onEnter: () => NodeEmitter.emit('navChangeIndex', 3),
			onEnterBack: () => NodeEmitter.emit('navChangeIndex', 3),
			// markers: true,
		});
	}

	animate(type) {
		// UI updates
		if (type === 'loading') {
			this.elements.form.button.style.cursor = 'not-allowed';
			this.isSending = true;

			GSAP.to(this.elements.form.icons.arrow, { autoAlpha: 0 });
			GSAP.fromTo(
				this.elements.form.icons.loading,
				{ autoAlpha: 0 },
				{ autoAlpha: 1 }
			);

			this.elements.form.buttonText.firstElementChild.innerHTML = `<span>Sending<span class="dotanim--1">.</span><span class="dotanim--2">.</span><span class="dotanim--3">.</span></span>`;
		}

		if (type === 'success') {
			GSAP.to(this.elements.form.icons.loading, { autoAlpha: 0 });
			GSAP.fromTo(
				this.elements.form.icons.check,
				{ autoAlpha: 0 },
				{ autoAlpha: 1 }
			);

			this.elements.form.button.classList.add('delivered');
			this.elements.form.icons.wrapper.classList.add('delivered');

			this.elements.form.buttonText.firstElementChild.innerHTML =
				this.lang === 'uk-ua' ? 'Надіслано' : 'Delivered';
		}

		if (type === 'error') {
			GSAP.to(this.elements.form.icons.loading, { autoAlpha: 0 });
			GSAP.fromTo(
				this.elements.form.icons.cross,
				{ autoAlpha: 0 },
				{ autoAlpha: 1 }
			);
			this.elements.form.buttonText.firstElementChild.innerHTML =
				this.lang === 'uk-ua' ? 'Помилка...' : 'Error...';
		}
	}

	async sendData(data) {
		try {
			await axios.post('/submitform', data).then(() => {
				this.animate('success');
			});
		} catch (error) {
			console.error(error.message);
			this.animate('error');

			// Error text
			this.elements.form.container.style.position = 'relative';
			this.elements.form.container.insertAdjacentHTML(
				'beforeend',
				`<p id="contactform-error-text" style="color: rgb(17,17,17);text-align: center;width: 100%;position: absolute;bottom: -96px;font-size: 16px;line-height: 22.5px;opacity: 0;">${
					this.lang === 'uk-ua'
						? `Будь ласка, зв'яжіться зі мною по e-mail <a class="nav__email__link" href="mailto:${this.contactEmail}">${this.contactEmail}</a>. Перепрошую за незручності!`
						: `Please contact me directly at <a class="nav__email__link" href="mailto:${this.contactEmail}">${this.contactEmail}</a>. Apologies for the inconvenience!`
				}</p>`
			);

			this.removeEventListeners();
			this.activateButton();
			this.elements.form.button.classList.add('active');

			GSAP.fromTo(
				'#contactform-error-text',
				{ opacity: 0 },
				{
					opacity: 1,
					duration: 1.5,
					ease: 'expo.out',
					delay: 0.2,
				}
			);
		}
	}

	activateButton() {
		this.elements.form.buttonText.classList.add('active');
		this.elements.form.icons.wrapper.classList.add('active');
	}

	deactivateButton() {
		this.elements.form.buttonText.classList.remove('active');
		this.elements.form.icons.wrapper.classList.remove('active');
	}

	createNewRequest(e) {
		if (this.isSending) return;
		this.elements.form.el.requestSubmit();
	}
	submitForm(e) {
		e.preventDefault();
		this.animate('loading');

		// Get data from form and add it to an object
		const finalData = {};
		const formData = new FormData(this.elements.form.el);

		[...formData].map((info) => {
			finalData[info[0]] = info[1];
		});

		// Send the object via axios
		this.sendData(finalData);
	}

	selectRadio(e) {
		e.target.closest('.contact__select__details').removeAttribute('open');
	}

	addEventListeners() {
		this.elements.form.el.addEventListener('submit', this.submitFormBound);

		this.elements.form.button.addEventListener('click', this.handleClickBound);

		this.elements.form.button.addEventListener(
			'mouseenter',
			this.handleMouseEnterBound
		);
		this.elements.form.button.addEventListener(
			'mouseleave',
			this.handleMouseLeaveBound
		);

		each(this.elements.form.labels, (label) => {
			label.addEventListener('click', (e) =>
				e.target.closest('.contact__select__details').removeAttribute('open')
			);
		});

		each(this.elements.form.detailsParentElement, (selection) => {
			selection.addEventListener('click', (e) => {
				let target = e.target.firstElementChild;
				if (!target) return;

				if (target.classList.contains('contact__form__group__svgarrow')) {
					target = target.closest('.contact__select__details');
				}

				if (target && target.classList.contains('contact__select__details')) {
					each(this.elements.form.details, (detail) => {
						if (detail !== target) {
							detail.removeAttribute('open');
						}
					});
				}
			});
		});
	}

	removeEventListeners() {
		this.elements.form.el.removeEventListener('submit', this.submitFormBound);

		this.elements.form.button.removeEventListener(
			'click',
			this.handleClickBound
		);

		this.elements.form.button.removeEventListener(
			'mouseenter',
			this.handleMouseEnterBound
		);
		this.elements.form.button.removeEventListener(
			'mouseleave',
			this.handleMouseLeaveBound
		);

		each(this.elements.form.labels, (label) => {
			label.removeEventListener('click', (e) =>
				e.target.closest('.contact__select__details').removeAttribute('open')
			);
		});

		each(this.elements.form.detailsParentElement, (selection) => {
			selection.removeEventListener('click', (e) => {
				let target = e.target.firstElementChild;

				if (target.classList.contains('contact__form__group__svgarrow')) {
					target = target.closest('.contact__select__details');
				}

				if (target && target.classList.contains('contact__select__details')) {
					each(this.elements.form.details, (detail) => {
						if (detail !== target) {
							detail.removeAttribute('open');
						}
					});
				}
			});
		});
	}

	destroy() {
		super.destroy();

		if (this.timeline) {
			this.timeline.kill();
			this.timeline = null;
		}
	}

	onResize() {}
}
