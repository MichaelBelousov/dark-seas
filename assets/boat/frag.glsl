// water fragment shader

uniform float time;
uniform vec2 lightPos;
uniform float lightIntensity;
uniform float lightRadius;
uniform float fogDensity; // TODO: remove?
uniform vec3 fogColor; // TODO: remove?
//uniform vec2 waterDir;
uniform sampler2D texture1; // TODO: noise
uniform sampler2D texture2; // TODO: caustic

varying vec2 vUv;

void main( void ) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
