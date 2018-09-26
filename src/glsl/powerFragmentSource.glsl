precision highp float;

varying vec2 v_coordinates;

uniform sampler2D u_spectrum;
uniform float u_resolution;

vec2 multiplyByI (vec2 z) {
    return vec2(-z[1], z[0]);
}

vec2 conjugate (vec2 z) {
    return vec2(z[0], -z[1]);
}

vec4 encodeFloat (float v) { //hack because WebGL cannot read back floats
    vec4 enc = vec4(1.0, 255.0, 65025.0, 160581375.0) * v;
    enc = fract(enc);
    enc -= enc.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
    return enc;
}

void main (void) {
    vec2 coordinates = v_coordinates - 0.5;

    vec4 z = texture2D(u_spectrum, coordinates);
    vec4 zStar = texture2D(u_spectrum, 1.0 - coordinates + 1.0 / u_resolution);
    zStar = vec4(conjugate(zStar.xy), conjugate(zStar.zw));

    vec2 r = 0.5 * (z.xy + zStar.xy);
    vec2 g = -0.5 * multiplyByI(z.xy - zStar.xy);
    vec2 b = z.zw;

    float rPower = length(r);
    float gPower = length(g);
    float bPower = length(b);

    float averagePower = (rPower + gPower + bPower) / 3.0;
    gl_FragColor = encodeFloat(averagePower / (u_resolution * u_resolution));
}
