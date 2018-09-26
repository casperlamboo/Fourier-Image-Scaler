precision highp float;

varying vec2 v_coordinates;

uniform float u_resolution;

uniform sampler2D u_texture;
uniform sampler2D u_spectrum;

void main (void) {
    vec3 image = texture2D(u_texture, v_coordinates).rgb;

    gl_FragColor = vec4(image, 1.0);
}
