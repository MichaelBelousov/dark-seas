// water fragment shader

uniform float time;
uniform float fogDensity;
uniform vec3 fogColor;
//uniform vec2 waterDir; // TODO: bubbles
uniform sampler2D texture1; // TODO: noise
uniform sampler2D texture2; // TODO: bubbles

varying vec2 vUv;

void main( void ) {
  vec2 position = - 1.0 + 2.0 * vUv;
  vec2 noiseScale = 1.0 * vec2(1.0, 1.0);
  vec2 noiseMove = vec2(time, time) * 0.001;
  vec2 noiseUvs = noiseScale * (noiseMove + vUv);
  vec4 noise = 1.0 * texture2D( texture1, noiseUvs );
  float noisePinch = 0.01;
  //vec2 finalNoise = clamp((noise-noisePinch) * (1.0/(1.0-noisePinch)), 0.0, 1.0).xy;
  vec2 finalNoise = noise.xy;
  vec2 colorScale = vec2(4.0, 4.0);
  vec2 colorMove = vec2(time, -time) * 0.001;
  vec2 colorUvs = colorScale * (colorMove + finalNoise + vUv);
  vec4 color = texture2D( texture2, colorUvs );
  //gl_FragColor = color;
  gl_FragColor = color;

  /*
  gl_FragColor = temp;
  float depth = gl_FragCoord.z / gl_FragCoord.w;
  const float LOG2 = 1.442695;
  float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
  fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );
  gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
  */
}
