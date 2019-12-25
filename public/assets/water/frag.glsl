// water fragment shader

uniform float time;
uniform float fogDensity;
uniform vec3 fogColor;
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
  vec2 position = - 1.0 + 2.0 * vUv;

  // caustics coord noise
  vec2 noiseMotion = 1.0 * vec2(0.1 * time, 0.1 * time);
  vec2 noiseScale = vec2(1.0, 1.0);
  vec2 noiseUvs = noiseScale * (noiseMotion + vUv);
  vec2 noise = texture2D(texture1, noiseUvs).xy;
  vec2 noiseFactor = vec2(0.3, 0.3);
  vec2 skewedNoise = noiseFactor * noise;
  
  // foreground caustics
  vec2 causticsUvs1 = vUv + skewedNoise;
  float caustics1 = texture2D(texture2, causticsUvs1).x;

  // background caustics
  vec2 causticsUvs2 = vec2(0.8, 0.8) * causticsUvs1 + vec2(0.8, 0.4);
  float caustics2 = texture2D(texture2, causticsUvs2).x;

  // mix layers
  float caustics = addBlacks(caustics1, caustics2, 0.02, 0.006);
  gl_FragColor = fromBw(caustics);

  //small noise
/*
  vec2 noiseScale = 3.0 * vec2(1.0, 1.0);
  vec2 noiseMove = vec2(time, time) * 0.001;
  vec2 noiseUvs = noiseScale * (noiseMove + vUv);
  vec4 noise = 1.0 * texture2D( texture1, noiseUvs);
  float noisePinch = 0.01;
  vec2 noiseFactor = vec2(0.1, 0.1);
  vec2 pinchedNoise = clamp((noise-noisePinch) * (1.0/(1.0-noisePinch)), 0.0, 1.0).xy;
  vec2 finalNoise = pinchedNoise * noiseFactor;

  vec2 colorScale = vec2(4.0, 4.0);
  vec2 colorMove = vec2(time, -time) * 0.010;
  vec2 colorUvs = colorScale * (colorMove + finalNoise + vUv);
  vec4 color = texture2D( texture2, colorUvs );
*/
  //gl_FragColor = color;
  //gl_FragColor = color;

  /*
  gl_FragColor = temp;
  float depth = gl_FragCoord.z / gl_FragCoord.w;
  const float LOG2 = 1.442695;
  float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
  fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );
  gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
  */
}
