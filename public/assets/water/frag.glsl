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

float addBlacks(float a, float b, float facA, float facB) {
  return (facA*(1.0-a) + facB*(1.0-b));
}

vec4 fromBw(float a) {
  return vec4(a,a,a,1.0);
}

void main( void ) {
  vec2 pos = - 1.0 + 2.0 * vUv;

  // caustics coord noise
  vec2 noiseMotion = 1.0 * vec2(0.1 * time, 0.1 * time);
  vec2 noiseScale = vec2(1.0, 1.0);
  vec2 noiseUvs = noiseScale * (noiseMotion + vUv);
  vec2 noise = texture2D(texture1, noiseUvs).xy;
  vec2 noiseFactor = vec2(0.3, 0.3);
  vec2 combinedNoise = noiseFactor * noise;
  
  // foreground caustics
  vec2 causticsMotion = 1.0 * vec2(0.05 * time, -0.05 * time);
  vec2 baseCausticsUvs = causticsMotion + vUv * vec2(2.0, 2.0);
  vec2 causticsUvs1 = baseCausticsUvs + combinedNoise;
  float caustics1 = texture2D(texture2, causticsUvs1).x;

  // background caustics
  vec2 causticsUvs2 = vec2(0.8, 0.8) * causticsUvs1 + vec2(0.8, 0.4);
  float caustics2 = texture2D(texture2, causticsUvs2).x;

  // mix layers
  float caustics = addBlacks(caustics1, caustics2, 0.06, 0.03);

  // lighting
  float thisIntensity = lightIntensity * clamp(
    lightRadius - distance(pos, lightPos),
    0.0, 1.0
  );
  gl_FragColor = fromBw(caustics * thisIntensity);
}
