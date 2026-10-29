/**
 * Fragment shader for the hero wall surface.
 *
 * A height field (broad undulation + coarse plaster grain, cross-faded into
 * fine trowel arcs as `uRough` falls) is lit by a low point light — raking
 * light, the way a finish is inspected on site. A construction-laser level
 * line is projected across it: on a rough surface the line breaks up; as the
 * surface is finished the line straightens.
 *
 * Value noise returns analytic derivatives, so the normal costs one surface
 * evaluation instead of three.
 */
export const vertexShader = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

uniform vec2 uRes;      // drawing buffer size in device px
uniform float uScale;   // device px per CSS px
uniform float uTime;
uniform vec2 uLight;    // light position, 0..1 (x right, y up)
uniform float uRough;   // 1 = raw plaster, 0 = finished putty
uniform float uExposure;
uniform float uLine;    // laser draw progress 0..1
uniform float uLineY;   // laser height, 0..1 from the bottom
uniform vec3 uAccent;   // laser colour (sRGB)

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Value noise with analytic derivatives: (value, d/dx, d/dy).
vec3 noised(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  float k1 = b - a;
  float k2 = c - a;
  float k4 = a - b - c + d;
  return vec3(a + k1 * u.x + k2 * u.y + k4 * u.x * u.y, du * vec2(k1 + k4 * u.y, k2 + k4 * u.x));
}

const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);

// Four-octave fBm with derivatives, at base frequency freq (cycles per CSS px).
vec3 fbmd(vec2 p, float freq) {
  vec2 q = p * freq;
  mat2 m = mat2(1.0, 0.0, 0.0, 1.0);
  float s = freq;
  float a = 0.5;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec3 n = noised(q);
    acc.x += a * n.x;
    acc.yz += a * s * (n.yz * m);
    q = ROT * q * 2.03 + 11.7;
    m = ROT * m;
    s *= 2.03;
    a *= 0.5;
  }
  return acc;
}

// One family of trowel strokes: a sharp edge, then a long taper.
vec3 strokes(vec2 p, vec2 centre, float spacing, vec3 warp) {
  vec2 d = p - centre;
  float r = length(d);
  float phase = r / spacing + warp.x;
  vec2 dphase = d / (r * spacing) + warp.yz;
  float f = fract(phase);
  float e = 0.035;
  float t = clamp(f / e, 0.0, 1.0);
  float s = t * t * (3.0 - 2.0 * t);
  float ds = f < e ? 6.0 * t * (1.0 - t) / e : 0.0;
  float h = s * (1.0 - f);
  float dh = ds * (1.0 - f) - s;
  return vec3(h, dh * dphase);
}

vec3 surface(vec2 p) {
  vec3 broad = fbmd(p, 0.0032) * 7.0;
  vec3 warp = fbmd(p + 91.0, 0.0018) * 1.6;
  vec3 fine = strokes(p, vec2(-700.0, 1500.0), 170.0, warp) * 0.9
            + strokes(p, vec2(2600.0, -900.0), 230.0, warp * 0.7) * 0.55;
  vec3 clusters = fbmd(p + 31.0, 0.05) * 1.7;
  vec3 g1 = noised(p * 0.36 + 7.0);
  vec3 g2 = noised(p * 0.81 + 3.0);
  vec3 grain = vec3(g1.x, g1.yz * 0.36) * 0.95 + vec3(g2.x, g2.yz * 0.81) * 0.42;
  return broad + mix(fine, clusters + grain, uRough);
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 size = uRes / uScale;
  vec2 p = gl_FragCoord.xy / uScale;

  vec3 s = surface(p);
  float bump = 1.15;
  vec3 n = normalize(vec3(-s.y * bump, -s.z * bump, 1.0));

  vec3 lightPos = vec3(uLight * size, size.y * 0.24);
  vec3 L = lightPos - vec3(p, 0.0);
  float dist = length(L);
  L /= dist;
  float diff = max(dot(n, L), 0.0);
  float atten = 1.0 / (1.0 + pow(dist / (size.y * 0.8), 2.0));

  vec3 albedo = vec3(0.86, 0.845, 0.81);
  vec3 col = albedo * (diff * atten * vec3(1.0, 0.95, 0.89) * 1.95 + 0.018);

  // Laser level line: displaced by the surface where it lands, drawn left to right.
  float lineY = uLineY * size.y;
  float near = abs(p.y - lineY);
  if (uLine > 0.0 && near < 60.0) {
    vec3 sl = surface(vec2(p.x, lineY));
    float y = lineY + (sl.x - 3.5) * 1.6 * uRough;
    float dy = p.y - y;
    float head = uLine * (size.x + 120.0) - 60.0;
    float reach = smoothstep(head + 2.0, head - 40.0, p.x);
    float core = exp(-pow(dy / 0.85, 2.0));
    float glow = exp(-pow(dy / 9.0, 2.0)) * 0.22;
    float spark = exp(-pow((p.x - head) / 26.0, 2.0)) * exp(-pow(dy / 5.0, 2.0)) * step(uLine, 0.999);
    vec3 laser = pow(uAccent, vec3(2.2));
    col += laser * (core * 2.4 + glow) * reach + laser * spark * 1.6;
  }

  col *= uExposure;
  col = aces(col);
  col = pow(col, vec3(1.0 / 2.2));

  vec2 uv = gl_FragCoord.xy / uRes;
  float vig = smoothstep(1.25, 0.25, length((uv - vec2(0.62, 0.62)) * vec2(1.0, 1.15)));
  col *= mix(0.55, 1.0, vig);
  col += (hash(gl_FragCoord.xy + fract(uTime * 13.0) * 97.0) - 0.5) * 0.028;

  gl_FragColor = vec4(col, 1.0);
}
`;
