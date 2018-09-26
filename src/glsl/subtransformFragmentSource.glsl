
precision highp float;

const float PI = 3.14159265;

uniform sampler2D u_input;

uniform float u_resolution;
uniform float u_subtransformSize;

uniform bool u_horizontal;
uniform bool u_forward;
uniform bool u_normalize;

vec2 multiplyComplex (vec2 a, vec2 b) {
    return vec2(a[0] * b[0] - a[1] * b[1], a[1] * b[0] + a[0] * b[1]);
}

void main (void) {

    float index = 0.0;
    if (u_horizontal) {
        index = gl_FragCoord.x - 0.5;
    } else {
        index = gl_FragCoord.y - 0.5;
    }

    float evenIndex = floor(index / u_subtransformSize) * (u_subtransformSize / 2.0) + mod(index, u_subtransformSize / 2.0);

    vec4 even = vec4(0.0), odd = vec4(0.0);

    if (u_horizontal) {
        even = texture2D(u_input, vec2(evenIndex + 0.5, gl_FragCoord.y) / u_resolution);
        odd = texture2D(u_input, vec2(evenIndex + u_resolution * 0.5 + 0.5, gl_FragCoord.y) / u_resolution);
    } else {
        even = texture2D(u_input, vec2(gl_FragCoord.x, evenIndex + 0.5) / u_resolution);
        odd = texture2D(u_input, vec2(gl_FragCoord.x, evenIndex + u_resolution * 0.5 + 0.5) / u_resolution);
    }

    //normalisation
    if (u_normalize) {
        even /= u_resolution * u_resolution;
        odd /= u_resolution * u_resolution;
    }

    float twiddleArgument = 0.0;
    if (u_forward) {
        twiddleArgument = 2.0 * PI * (index / u_subtransformSize);
    } else {
        twiddleArgument = -2.0 * PI * (index / u_subtransformSize);
    }
    vec2 twiddle = vec2(cos(twiddleArgument), sin(twiddleArgument));

    vec2 outputA = even.rg + multiplyComplex(twiddle, odd.rg);
    vec2 outputB = even.ba + multiplyComplex(twiddle, odd.ba);

    gl_FragColor = vec4(outputA, outputB);

}
