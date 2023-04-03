import Preloader from './components/Preloader';
import Experience from './components/Canvas/Experience';

class App {
	constructor() {
		this.create();
		// this.createPreloader();
	}

	create() {
		this.experience = new Experience('.webgl');
		this.update();
	}

	createPreloader() {
		this.preloader = new Preloader();
		this.preloader.once('completed', this.onPreloaded.bind(this));
	}

	onPreloaded() {
		this.preloader.hide();
	}

	update() {
		if (this.experience && this.experience.update) this.experience.update();
		this.frame = window.requestAnimationFrame(this.update.bind(this));
	}
}

new App();
