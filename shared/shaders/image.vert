
#define M_PI 3.1415926535897932384626433832795
uniform vec2 uResolution;
uniform vec2 uImageRes;
varying vec2 vUv;


uniform float uProgress;
uniform vec2 uMouse;
uniform vec2 uZoomScale;
uniform float uScrollVelocity; 

out vec2 vUvCover;

vec3 deformationCurve(vec3 position, vec2 uv) {
  // position.y = position.y - (sin(uv.x * 3.1415) * min(abs(uScrollVelocity), 50.0) * sign(uScrollVelocity) * -0.1);
	position.x = position.x - (sin(uv.y * 3.1415) * min(abs(uScrollVelocity), 15.0) * sign(uScrollVelocity) * -0.0015);

  return position;
}

void main() {
	vUv = uv;

	vec3 pos = position;
	float angle = uProgress * M_PI / 2.;	
	float wave = cos(angle);
	float c = sin(length(uv - .5) * 15. + uProgress * 2.) * .5 + .5;
	pos.x *= mix(1., uZoomScale.x + wave * c, uProgress);
	pos.y *= mix(1., uZoomScale.y + wave * c, uProgress);

	vec3 deformedPosition = deformationCurve(pos, vUv);

	gl_Position = projectionMatrix * modelViewMatrix * vec4( deformedPosition, 1.0 );
}