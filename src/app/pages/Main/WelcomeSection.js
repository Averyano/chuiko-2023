import Component from '../../classes/Component';
import GSAP from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
GSAP.registerPlugin(ScrollTrigger);
import Reveal from '../../animations/Reveal';
import NodeEmitter from '../../classes/NodeEmitter';

export default class WelcomeSection extends Component {
	constructor() {
		super({
			element: '.welcome',
			elements: {
				title: '.welcome__title',
				video: '.welcome__video',
				textWrapper: '.welcome__text__wrapper',
				textElements: '.welcome__text__element',
			},
		});
	}

	create() {
		super.createComponent();

		this.createTimeline();
		this.animateTimeline();
		// this.playWelcomeVideo();
		// this.addRevealAnimation();
	}

	createTimeline() {
		this.timeline = GSAP.timeline({
			scrollTrigger: {
				trigger: this.element,
				scrub: 1,
				start: 'bottom bottom',
				end: 'bottom top',
				// markers: true,
			},
		});

		this.timelineInstant = GSAP.timeline({
			scrollTrigger: {
				trigger: this.element,
				onEnter: () => this.playWelcomeVideo(),
				onLeave: () => this.pauseWelcomeVideo(),
				onEnterBack: () => this.playWelcomeVideo(),
				onLeaveBack: () => this.pauseWelcomeVideo(),
				start: 'top bottom',
				end: 'bottom top',
				// markers: true,
			},
		});

		ScrollTrigger.create({
			trigger: this.element,
			end: 'bottom+=25% top',
			onEnter: () => NodeEmitter.emit('navChangeIndex', 1),
			onEnterBack: () => NodeEmitter.emit('navChangeIndex', 1),
		});
	}

	animateTimeline() {
		this.timeline.fromTo(
			this.elements.video,
			{
				rotateX: 0,
			},
			{
				rotateX: -5,
				duration: 1.5,
				ease: 'out.expo',
			}
		);

		// instance timeline playWelcomeVideo on trigger
	}

	playWelcomeVideo() {
		console.log('playWelcomeVideo');
		if (this.elements.video.paused) {
			const playPromise = this.elements.video.play();

			if (playPromise !== undefined) {
				playPromise.catch((error) => {
					console.error('Video play failed:', error);
				});
			}
		}
	}
	pauseWelcomeVideo() {
		console.log('pauseWelcomeVideo');
		if (!this.elements.video.paused) {
			const playPromise = this.elements.video.pause();

			if (playPromise !== undefined) {
				playPromise.catch((error) => {
					console.error('Video play failed:', error);
				});
			}
		}
	}

	destroy() {
		super.destroy();

		if (this.timeline) {
			this.timeline.kill();
			this.timeline = null;
		}
		if (this.timelineInstant) {
			this.timelineInstant.kill();
			this.timelineInstant = null;
		}
	}
}
