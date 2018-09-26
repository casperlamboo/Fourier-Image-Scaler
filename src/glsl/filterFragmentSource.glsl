precision highp float;

uniform sampler2D u_input;
uniform float u_resolution;

uniform float u_maxEditFrequency;

uniform sampler2D u_filter;

void main (void) {
    vec2 coordinates = gl_FragCoord.xy - 0.5;
    float xFrequency = (coordinates.x < u_resolution * 0.5) ? coordinates.x : coordinates.x - u_resolution;
    float yFrequency = (coordinates.y < u_resolution * 0.5) ? coordinates.y : coordinates.y - u_resolution;

    float frequency = sqrt(xFrequency * xFrequency + yFrequency * yFrequency);

    float gain = texture2D(u_filter, vec2(frequency / u_maxEditFrequency, 0.5)).a;
    vec4 originalPower = texture2D(u_input, gl_FragCoord.xy / u_resolution);

    gl_FragColor = originalPower * gain;

}
