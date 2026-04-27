// Screen-space film grain post-processing pass.
// Simplex noise implementation: Ashima Arts / Stefan Gustavson (MIT License)
// https://github.com/ashima/webgl-noise

export const FilmGrainShader = {

	uniforms: {
		tDiffuse:   { value: null },
		uTime:      { value: 0.0 },  // seconds — drives per-frame grain animation
		uStrength:  { value: 0.35 }, // grain intensity  (0.0 – 1.0)
		uGrainSize: { value: 0.15 }, // 0.0 = fine film, 1.0 = coarse
	},

	vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,

	fragmentShader: /* glsl */`
		uniform sampler2D tDiffuse;
		uniform float uTime;
		uniform float uStrength;
		uniform float uGrainSize;

		varying vec2 vUv;

		vec3 _mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
		vec2 _mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
		vec3 _permute(vec3 x) { return _mod289v3(((x * 34.0) + 10.0) * x); }

		float snoise(vec2 v) {
			const vec4 C = vec4(
				 0.211324865405187,
				 0.366025403784439,
				-0.577350269189626,
				 0.024390243902439
			);
			vec2 i  = floor(v + dot(v, C.yy));
			vec2 x0 = v - i + dot(i, C.xx);
			vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
			vec4 x12 = x0.xyxy + C.xxzz;
			x12.xy -= i1;
			i = _mod289v2(i);
			vec3 p = _permute(_permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
			vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
			m = m * m;
			m = m * m;
			vec3 x  = 2.0 * fract(p * C.www) - 1.0;
			vec3 h  = abs(x) - 0.5;
			vec3 ox = floor(x + 0.5);
			vec3 a0 = x - ox;
			m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
			vec3 g;
			g.x  = a0.x  * x0.x   + h.x  * x0.y;
			g.yz = a0.yz * x12.xz + h.yz * x12.yw;
			return 130.0 * dot(m, g);
		}

		void main() {
			vec4 texel = texture2D(tDiffuse, vUv);
			vec3 color = texel.rgb;

			// Map grain size 0→1 to noise tile density: fine (800 tiles) → coarse (100 tiles)
			float grainScale = mix(800.0, 100.0, uGrainSize);
			// Large time multipliers ensure a fully new pattern every frame at 60 fps
			vec2 grainUv = vUv * grainScale + vec2(uTime * 500.0, uTime * 300.0);

			float grain = snoise(grainUv);

			// Luminance-weighted mask — heavier grain in shadows/midtones, lighter in highlights
			float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
			float mask = smoothstep(1.0, 0.2, lum);

			color += grain * uStrength * 0.12 * mask;

			gl_FragColor = vec4(clamp(color, 0.0, 1.0), texel.a);
		}
	`,

};
