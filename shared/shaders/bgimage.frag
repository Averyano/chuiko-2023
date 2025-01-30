uniform sampler2D uTexture;
uniform vec2 uResolution; // 1, 1
uniform vec2 uZoomScale; // 1, 1
uniform vec2 uImageRes; // tex.source.data.width & height

uniform vec2 uScale;
uniform vec2 uOffset;
uniform vec2 uMouse;
uniform float uDarken;

varying vec2 vUv;

vec3 rgbShift(sampler2D textureImage, vec2 uv, vec2 offset) {
	float r = texture2D(textureImage,uv + offset).r;
	vec2 gb = texture2D(textureImage,uv).gb;
	return vec3(r,gb);
}

/*------------------------------
Background Cover UV
--------------------------------
u = basic UV
s = screensize
i = image size
------------------------------*/
vec2 CoverUV(vec2 u, vec2 s, vec2 i) {
	float rs = s.x / s.y; // Aspect screen size
	float ri = i.x / i.y; // Aspect image size
	vec2 st = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x); // New st
	vec2 o = (rs < ri ? vec2((st.x - s.x) / 2.0, 0.0) : vec2(0.0, (st.y - s.y) / 2.0)) / st; // Offset
	return u * s / st + o;
}

float tvNoise (vec2 p, float ta, float tb) {
  return fract(sin(p.x * ta + p.y * tb) * 5678.);
}
vec3 draw(sampler2D image, vec2 uv) {
  return texture2D(image,vec2(uv.x, uv.y)).rgb;   
}
float rand(vec2 co){
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}
vec3 blur(vec2 uv, sampler2D image, float blurAmount){
  vec3 blurredImage = vec3(0.);
  float gradient = smoothstep(0.8, 0.0, 3.4 - (gl_FragCoord.y)) * 1. + smoothstep(0.8, 0.0, (gl_FragCoord.y)) * 1.;
  #define repeats 40.
  for (float i = 0.; i < repeats; i++) { 
    vec2 q = vec2(cos(degrees((i / repeats) * 360.)), sin(degrees((i / repeats) * 360.))) * (rand(vec2(i, uv.x + uv.y)) + blurAmount); 
    vec2 uv2 = uv + (q * blurAmount * gradient);
    blurredImage += draw(image, uv2) / 2.;
    q = vec2(cos(degrees((i / repeats) * 360.)), sin(degrees((i / repeats) * 360.))) * (rand(vec2(i + 2., uv.x + uv.y + 24.)) + blurAmount); 
    uv2 = uv + (q * blurAmount * gradient);
    blurredImage += draw(image, uv2) / 2.;
  }
  return blurredImage / repeats;
}

void main() {
	vec2 uv = CoverUV(vUv, uResolution, uImageRes);
	// vec3 tex = texture2D(uTexture, uv).rgb;
	vec3 color = rgbShift(uTexture, uv, uOffset);
	vec4 final = vec4(blur(uv, uTexture, 0.08), 1.);
	// gl_FragColor = vec4( color * uDarken, 1.0 );
	gl_FragColor = final;
}

// void main() {

// 	float uvx, uvy;
// 	if (uScale.x > uScale.y) {
// 		uvx = vUv.x  / uScale.x;
// 		uvy = vUv.y / uScale.y;
// 	} else {
// 		uvx = vUv.x / uScale.x;
// 		uvy = vUv.y / uScale.y;
// 	}

// 	vec2 newuv = vec2(uvx, uvy);

// 	vec3 color = rgbShift(uTexture, newuv, uOffset);
// 	// vec4 image = texture2D(uTexture, newuv);

// 	gl_FragColor = vec4(color, 1.0);
// }