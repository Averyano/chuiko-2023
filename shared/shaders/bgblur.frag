uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uImageRes;
uniform float uOpacity;

varying vec2 vUv;

vec2 CoverUV(vec2 u, vec2 s, vec2 i) {
	float rs = s.x / s.y;
	float ri = i.x / i.y;
	vec2 st = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
	vec2 o = (rs < ri ? vec2((st.x - s.x) / 2.0, 0.0) : vec2(0.0, (st.y - s.y) / 2.0)) / st;
	return u * s / st + o;
}

float rand(vec2 co) {
	return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
	vec2 uv = CoverUV(vUv, uResolution, uImageRes);

	float blurAmount = 0.09;
	vec3 color = vec3(0.0);
	float repeats = 40.0;

	for (float i = 0.0; i < 40.0; i++) {
		float angle = (i / repeats) * 6.28318;
		vec2 q = vec2(cos(angle), sin(angle)) * (rand(vec2(i, uv.x + uv.y)) + blurAmount);
		color += texture2D(uTexture, uv + q * blurAmount).rgb / 2.0;
		q = vec2(cos(angle), sin(angle)) * (rand(vec2(i + 2.0, uv.x + uv.y + 24.0)) + blurAmount);
		color += texture2D(uTexture, uv + q * blurAmount).rgb / 2.0;
	}
	color /= repeats;

	gl_FragColor = vec4(color, uOpacity);
}
