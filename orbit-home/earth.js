import * as THREE from 'three';
import { mulberry, cv, tex } from './station.js';

/* 归一化尺度：地球半径 R = 1（= 6371 km）。相机在 r = 1 + h/6371。 */

const SUN_BASE = new THREE.Vector3(-0.68, 0.55, 0.80).normalize();

/* 真实城市坐标 + 人口权重，用于程序化夜面灯光（离线、地理正确） */
const CITIES = [
  [116.4, 39.9, 1.0], [121.5, 31.2, 1.0], [113.3, 23.1, .9], [114.1, 22.5, .9], [104.1, 30.7, .7],
  [106.5, 29.6, .7], [114.3, 30.6, .7], [118.8, 32.1, .6], [120.2, 30.3, .6], [117.2, 39.1, .6],
  [113.6, 34.7, .6], [108.9, 34.3, .5], [123.4, 41.8, .5], [126.6, 45.8, .4], [125.3, 43.9, .4],
  [117.0, 36.7, .5], [120.4, 36.1, .5], [112.9, 28.2, .5], [115.9, 28.7, .4], [119.3, 26.1, .4],
  [118.1, 24.5, .4], [102.7, 25.0, .4], [106.7, 26.6, .3], [108.3, 22.8, .3], [110.3, 20.0, .3],
  [87.6, 43.8, .3], [91.1, 29.7, .2], [103.8, 36.1, .3], [101.8, 36.6, .2], [111.7, 40.8, .3],
  [112.5, 37.9, .3], [114.5, 38.0, .4], [115.5, 32.9, .3], [121.6, 38.9, .4], [126.5, 43.8, .3],
  [139.7, 35.7, 1.0], [135.5, 34.7, .8], [136.9, 35.2, .6], [130.4, 33.6, .5], [141.3, 43.1, .4],
  [127.0, 37.6, .9], [129.1, 35.2, .5], [126.7, 37.5, .4],
  [121.0, 14.6, .7], [120.98, 14.6, .5], [106.8, -6.2, .8], [112.7, -7.3, .5], [100.5, 13.8, .7],
  [106.7, 10.8, .6], [105.8, 21.0, .5], [103.8, 1.35, .6], [101.7, 3.1, .5], [96.2, 16.9, .4],
  [77.2, 28.6, .9], [72.9, 19.1, .9], [88.4, 22.6, .7], [80.3, 13.1, .6], [77.6, 13.0, .6],
  [78.5, 17.4, .6], [73.9, 18.5, .5], [72.6, 23.0, .5], [75.8, 26.9, .4], [80.9, 26.8, .4],
  [85.3, 27.7, .3], [90.4, 23.8, .6], [67.0, 24.9, .6], [74.3, 31.5, .5], [73.0, 33.7, .4],
  [44.4, 33.3, .5], [51.4, 35.7, .7], [46.7, 24.7, .5], [39.2, 21.5, .4], [55.3, 25.3, .5],
  [51.5, 25.3, .3], [47.98, 29.4, .3], [35.2, 31.8, .4], [35.9, 31.95, .3], [36.3, 33.5, .3],
  [31.2, 30.0, .8], [29.9, 31.2, .4], [32.5, 15.6, .3], [3.4, 6.5, .7], [7.5, 9.1, .4],
  [-0.2, 5.6, .4], [-17.4, 14.7, .3], [36.8, -1.3, .4], [38.7, 9.0, .3], [32.6, 0.3, .3],
  [18.4, -33.9, .4], [28.0, -26.2, .5], [31.0, -29.9, .3], [13.2, -8.8, .3], [15.3, -4.3, .3],
  [2.35, 48.86, .9], [-0.13, 51.5, .9], [13.4, 52.5, .7], [4.9, 52.4, .6], [4.35, 50.85, .5],
  [12.5, 41.9, .6], [9.19, 45.46, .6], [-3.7, 40.4, .6], [2.17, 41.4, .5], [-9.14, 38.7, .4],
  [23.7, 37.98, .4], [28.98, 41.0, .7], [37.6, 55.75, .8], [30.3, 59.9, .5], [30.5, 50.45, .5],
  [21.0, 52.2, .5], [14.4, 50.1, .4], [19.04, 47.5, .4], [26.1, 44.4, .4], [16.37, 48.2, .4],
  [8.54, 47.37, .4], [9.99, 53.55, .4], [11.58, 48.14, .5], [6.96, 50.94, .4], [8.68, 50.11, .4],
  [12.57, 55.68, .4], [18.07, 59.33, .4], [10.75, 59.91, .3], [24.94, 60.17, .3], [25.28, 54.69, .3],
  [-6.26, 53.35, .4], [-2.24, 53.48, .5], [-1.9, 52.48, .4], [-1.55, 53.8, .4], [-3.19, 55.95, .4],
  [-74.0, 40.7, 1.0], [-71.06, 42.36, .7], [-75.16, 39.95, .6], [-77.04, 38.9, .6], [-84.39, 33.75, .6],
  [-80.19, 25.76, .6], [-87.63, 41.88, .8], [-83.05, 42.33, .5], [-95.37, 29.76, .6], [-96.8, 32.78, .6],
  [-118.24, 34.05, .9], [-122.42, 37.77, .7], [-122.33, 47.61, .5], [-104.99, 39.74, .5], [-112.07, 33.45, .5],
  [-122.68, 45.52, .4], [-93.27, 44.98, .4], [-90.2, 38.63, .4], [-94.58, 39.1, .4], [-79.99, 40.44, .4],
  [-79.38, 43.65, .6], [-73.57, 45.5, .5], [-123.12, 49.28, .4], [-114.07, 51.05, .3], [-99.13, 19.43, .8],
  [-103.35, 20.67, .4], [-100.32, 25.67, .4], [-90.53, 14.63, .3], [-84.08, 9.93, .3], [-79.52, 8.98, .3],
  [-66.9, 10.5, .5], [-74.08, 4.6, .5], [-75.56, 6.24, .4], [-77.03, -12.05, .5], [-70.65, -33.45, .5],
  [-58.38, -34.6, .7], [-46.63, -23.55, .9], [-43.17, -22.91, .7], [-47.88, -15.79, .4], [-38.5, -12.97, .4],
  [-34.88, -8.05, .4], [-56.16, -34.9, .3], [-57.63, -25.3, .3], [-68.13, -16.5, .3],
  [151.2, -33.87, .6], [144.96, -37.81, .5], [153.02, -27.47, .4], [115.86, -31.95, .4], [138.6, -34.93, .3],
  [174.76, -36.85, .3], [174.78, -41.29, .2], [-157.86, 21.31, .3], [-149.9, 61.22, .2],
];

/* 城市群面光：让夜面不是孤立点，而是成片 */
const REGIONS = [
  [117, 34, 9, 5, .5], [120, 31, 6, 4, .55], [113.5, 23, 5, 3.5, .5], [105, 30, 5, 3.5, .35],
  [137, 35.5, 6, 3, .5], [127, 37.3, 3.5, 3, .5], [77, 27, 9, 6, .5], [78, 20, 8, 7, .35],
  [8, 49, 10, 6, .5], [-1, 52.5, 5, 4, .5], [10, 45, 6, 3.5, .45], [-4, 40, 5, 4, .35],
  [37, 55.5, 6, 4, .4], [-76, 40, 8, 5, .55], [-87, 41.5, 6, 4, .45], [-118, 34, 5, 3.5, .5],
  [-122, 37.5, 4, 3.5, .4], [-95, 30, 5, 4, .4], [-99, 19.5, 4, 3, .45], [-46.5, -23.5, 5, 4, .5],
  [31, 30, 3, 2.5, .45], [3, 7, 4, 3, .35], [28, -26, 4, 3, .35], [51, 35.5, 4, 3, .4],
  [106.8, -6.3, 4, 2.5, .45], [121, 14.6, 3, 3, .4], [151, -33.8, 3.5, 3, .4],
];

function nightTexture() {
  const W = 4096, H = 2048, [c, g] = cv(W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const px = lon => (lon + 180) / 360 * W;
  const py = lat => (90 - lat) / 180 * H;
  g.globalCompositeOperation = 'lighter';
  for (const [lon, lat, rx, ry, a] of REGIONS) {
    const x = px(lon), y = py(lat), r = rx / 360 * W;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(255,196,120,${a * .06})`);
    grd.addColorStop(.55, `rgba(255,170,90,${a * .025})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y);
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore();
  }
  const rnd = mulberry(77);
  for (const [lon, lat, w] of CITIES) {
    const x = px(lon), y = py(lat);
    const r = 4.4 + w * 15;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(255,226,170,${.28 + w * .22})`);
    grd.addColorStop(.35, `rgba(255,190,110,${.10 + w * .10})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    const n = 24 + (w * 70 | 0);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), .6) * r * 2.6;
      const sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d * .7;
      g.fillStyle = `rgba(255,214,150,${.25 + rnd() * .5 * w})`;
      g.fillRect(sx, sy, 1.2 + rnd() * 2.2, 1.0 + rnd() * 1.6);
    }
  }
  g.globalCompositeOperation = 'source-over';
  return c;
}

const planetVertex = /* glsl */`
  varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld; varying vec3 vLocal; varying vec2 vNdc;
  void main(){
    vUv = uv; vLocal = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 clip = projectionMatrix * viewMatrix * world;
    vNdc = clip.xy / clip.w;
    gl_Position = clip;
  }
`;

/* 云场共享 GLSL：NASA 云图仅作大尺度天气掩膜，云的实际形状由域扭曲 fbm 生成，
   否则全球贴图在视野内只有几百 texel，放大后是一团雾。气旋锚定地理坐标。 */
const cloudCommon = /* glsl */`
  uniform sampler2D uClouds, uStormTex; uniform float uTime, uStorm, uCloudOffset; uniform vec2 uStormCenter;
  float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1,0)), f.x), mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++){ s += a * vnoise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; } return s; }
  /* 气旋用卫星风格云图贴花：真实旋臂纤维结构比程序噪声可信 */
  float stormField(vec2 suv, out float eyeClear){
    vec2 d = suv - uStormCenter; d.x = mod(d.x + 0.5, 1.0) - 0.5; d.x *= 2.0;
    float ca = cos(uTime * 0.02), sa = sin(uTime * 0.02);
    vec2 tuv = (mat2(ca, -sa, sa, ca) * d) / 0.036 + 0.5;
    float fade = smoothstep(0.50, 0.40, length(tuv - 0.5));
    float lum = texture2D(uStormTex, tuv).r;
    eyeClear = fade * (1.0 - smoothstep(0.25, 0.45, lum));
    return uStorm * fade * smoothstep(0.30, 0.62, lum);
  }
  float cloudLite(vec2 uv){
    float mask = texture2D(uClouds, uv).r;
    float shape = fbm(uv * vec2(760.0, 380.0));
    float base = clamp(mask * 0.30 + shape * 1.35 - 0.50, 0.0, 1.0);
    float ec; float st = stormField(uv - vec2(uCloudOffset, 0.0), ec);
    base *= 1.0 - ec * 0.95;
    return clamp(max(base * (1.0 - smoothstep(0.02, 0.25, st)), st), 0.0, 1.0);
  }
  float cloudBase(vec2 uv){
    float mask = texture2D(uClouds, uv).r;
    vec2 w = vec2(fbm(uv * vec2(70.0, 35.0) + 3.1), fbm(uv * vec2(70.0, 35.0) + 7.7)) - 0.5;
    float shape = fbm(uv * vec2(760.0, 380.0) + w * 2.2);
    float base = clamp(mask * 0.30 + shape * 1.35 - 0.50, 0.0, 1.0);
    float ec; float st = stormField(uv - vec2(uCloudOffset, 0.0), ec);
    base *= 1.0 - ec * 0.95;
    return clamp(max(base * (1.0 - smoothstep(0.02, 0.25, st)), st), 0.0, 1.0);
  }
`;

const surfaceFragment = /* glsl */`
  uniform sampler2D uDay, uNight;
  uniform vec3 uSun;
  uniform float uShadowLen, uNightGain, uSunLeft;
  varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld; varying vec2 vNdc;
  ${cloudCommon}
  void main(){
    vec3 n = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorld);
    vec3 day = texture2D(uDay, vUv).rgb;
    float water = smoothstep(1.0, 1.45, day.b / (max(day.r, day.g) + 0.0001));
    vec3 ocean = vec3(0.002, 0.026, 0.085) + day * 0.62;
    vec3 albedo = mix(day, ocean, water);
    albedo = mix(albedo, albedo * vec3(0.82, 1.02, 1.28), water * 0.55);
    albedo = mix(albedo, albedo * vec3(0.78, 0.90, 0.72), (1.0 - water) * 0.45);
    float ndl = dot(n, uSun);
    /* 构图级昼夜分割：参考图夜面城市灯在右侧，物理太阳方向无法同时入画 */
    float artNight = smoothstep(0.55, 0.85, vNdc.x * 0.5 + 0.5 + vNdc.y * 0.06) * uSunLeft;
    float daylight = smoothstep(-0.16, 0.12, ndl) * (1.0 - artNight * 0.97);
    float diffuse = pow(max(ndl, 0.0), 0.72) * (1.0 - artNight * 0.97);
    /* 云影沿太阳切向偏移：两级采样做半影 */
    vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-5, 0.0, 0.0));
    vec3 north = cross(n, east);
    vec2 sunT = vec2(dot(uSun, east), dot(uSun, north)) * vec2(0.159, 0.318);
    float sh1 = cloudLite(vUv - sunT * uShadowLen);
    float sh2 = cloudLite(vUv - sunT * uShadowLen * 2.3);
    float shadow = 1.0 - (smoothstep(0.14, 0.80, sh1) * 0.70 + smoothstep(0.20, 0.85, sh2) * 0.30) * daylight;
    vec3 color = albedo * (0.06 + diffuse * 1.42) * shadow;
    color *= 0.92 + 0.16 * vnoise(vUv * vec2(1400.0, 700.0));
    vec3 hv = normalize(uSun + view);
    float sp = max(dot(n, hv), 0.0);
    float fresnel = 0.03 + 0.30 * pow(1.0 - max(dot(n, view), 0.0), 4.0);
    color += vec3(1.0, 0.88, 0.66) * (pow(sp, 90.0) * 3.0 * fresnel + pow(sp, 5.0) * 1.35 * (0.3 + 0.7 * fresnel)) * water * daylight;
    /* 金色耀斑池：与左上镜头眩光同源的构图光，云与陆地遮断 */
    float pool = exp(-pow((vNdc.x + 0.60) / 0.24, 2.0)) * exp(-pow((vNdc.y + 0.08) / 0.30, 2.0));
    pool *= (1.0 - smoothstep(0.20, 0.70, cloudLite(vUv))) * water * daylight * uSunLeft;
    float streak = 0.45 + 1.10 * pow(vnoise(vec2(vUv.x * 3000.0, vUv.y * 420.0)), 2.0);
    color += mix(vec3(1.0, 0.72, 0.32), vec3(1.0, 0.94, 0.78), pool) * pool * streak;
    float rim = pow(1.0 - max(dot(n, view), 0.0), 4.0);
    color += vec3(0.016, 0.10, 0.26) * rim * daylight;
    vec3 lights = pow(texture2D(uNight, vUv).rgb, vec3(1.8));
    color += lights * vec3(1.0, 0.82, 0.52) * uNightGain * (1.0 - daylight);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const cloudsFragment = /* glsl */`
  uniform vec3 uSun; uniform float uCover, uRelief, uSunLeft;
  varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld; varying vec2 vNdc;
  ${cloudCommon}
  void main(){
    vec3 n = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorld);
    vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-5, 0.0, 0.0));
    vec3 north = cross(n, east);
    /* 视差：云顶高于地表，随视线微移，产生厚度错觉 */
    vec2 uv = vUv - vec2(dot(view, east), dot(view, north)) * 0.0022;
    float e = 0.0012;
    float dRaw = cloudBase(uv);
    float amp = smoothstep(0.04, 0.22, dRaw);
    float d0 = clamp(dRaw + ((vnoise(uv * vec2(1100.0, 550.0)) - 0.5) * 0.26
                 + (vnoise(uv * vec2(2200.0, 1100.0)) - 0.5) * 0.10
                 + (vnoise(uv * vec2(4400.0, 2200.0)) - 0.5) * 0.06) * amp, 0.0, 1.0);
    /* 密度梯度 → 伪法线：大尺度坡向决定受光面/背光面，高频只做絮状起伏 */
    float E = 0.0035;
    float ca = cloudLite(uv + vec2(E, 0.0));
    float cb = cloudLite(uv - vec2(E, 0.0));
    float cc = cloudLite(uv + vec2(0.0, E));
    float cd = cloudLite(uv - vec2(0.0, E));
    float gx = ca - cb;
    float gy = cc - cd;
    float ao = (ca + cb + cc + cd) * 0.25;
    float hx = vnoise(uv * vec2(700.0, 350.0) + vec2(e, 0.0)) - vnoise(uv * vec2(700.0, 350.0) - vec2(e, 0.0));
    float hy = vnoise(uv * vec2(700.0, 350.0) + vec2(0.0, e)) - vnoise(uv * vec2(700.0, 350.0) - vec2(0.0, e));
    vec3 N = normalize(n - (east * (gx * 2.4 + hx * 1.1) + north * (gy * 2.4 + hy * 1.1)) * uRelief);
    float ndlN = dot(N, uSun);
    float ndl = mix(dot(n, uSun), ndlN, 0.9);
    /* 云顶只比地表早一点见到太阳：太阳在地平线下时伪法线不得凭空造光 */
    float sunUp = smoothstep(-0.04, 0.04, dot(n, uSun));
    float artNight = smoothstep(0.55, 0.85, vNdc.x * 0.5 + 0.5 + vNdc.y * 0.06) * uSunLeft;
    float dayF = smoothstep(-0.02, 0.08, dot(n, uSun)) * (1.0 - artNight * 0.97);
    float key = pow(max(ndl, 0.0), 0.85) * sunUp;
    float wrap = max(dot(n, uSun) * 0.5 + 0.5, 0.0);
    float hf = vnoise(uv * vec2(700.0, 350.0));
    float selfSh = smoothstep(0.20, 0.9, d0) * smoothstep(0.35, -0.20, ndl)
                 + smoothstep(0.45, 0.85, hf) * 0.25;
    vec3 lit = vec3(1.0, 0.985, 0.965) * (0.18 + 2.45 * key) * dayF;
    lit *= 1.0 + 0.75 * smoothstep(0.45, 0.85, d0) * key;
    /* 背光面压暗 + 云团缝隙 AO：亮顶暗侧才是体积 */
    lit *= mix(0.55, 1.0, smoothstep(-0.15, 0.55, ndlN));
    lit *= 1.0 - 0.22 * smoothstep(0.45, 0.90, ao) * smoothstep(0.25, 0.70, d0) * (1.0 - key);
    lit += vec3(0.30, 0.36, 0.46) * pow(wrap, 2.0) * 0.30 * dayF;
    float term = exp(-pow(dot(n, uSun) / 0.18, 2.0)) * smoothstep(-0.10, 0.0, dot(n, uSun));
    lit = mix(lit, vec3(1.0, 0.62, 0.38) * (key + 0.10), term * 0.18);
    /* 银边：薄云逆光透射（视线朝向太阳时才成立）；深夜太阳被地球本体遮挡，透射不成立 */
    float mu = max(-dot(view, uSun), 0.0);
    float twilight = smoothstep(-0.24, -0.04, dot(n, uSun));
    lit += vec3(1.0, 0.90, 0.75) * pow(mu, 6.0) * (1.0 - d0) * d0 * 2.0 * twilight * (1.0 - artNight);
    vec3 col = lit * (1.0 - clamp(selfSh, 0.0, 1.0) * 0.70) + vec3(0.020, 0.030, 0.048);
    float th = 0.06 + (1.0 - uCover) * 0.42 + (vnoise(uv * vec2(1600.0, 800.0)) - 0.5) * 0.10;
    float alpha = smoothstep(th, th + 0.07, d0) * 0.95 * mix(uCover, 1.0, smoothstep(0.50, 0.80, d0));
    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* 银河背景球：带尘带的旋臂光带 + 未解析星尘， additive 叠在清屏色上 */
const skyFragment = /* glsl */`
  uniform float uMilky, uTime;
  varying vec3 vLocal;
  float hash31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float n3(vec3 p){
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x), mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x), mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm3(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * n3(p); p = p * 2.07 + vec3(13.7, 7.3, 5.1); a *= 0.5; } return s; }
  /* 圆点星尘：格哈希偏移 + 径向衰减，避免噪声等值面拉成短划线 */
  float starLayer(vec3 d, float freq, float cut){
    vec3 g = d * freq; vec3 id = floor(g); vec3 f = fract(g) - 0.5;
    float h = hash31(id + 7.7);
    vec3 off = vec3(hash31(id), hash31(id + 17.1), hash31(id + 31.7)) - 0.5;
    float dist = length(f - off * 0.6);
    return smoothstep(0.16, 0.02, dist) * step(cut, h) * (0.4 + 0.6 * hash31(id + 3.3));
  }
  void main(){
    vec3 d = normalize(vLocal);
    vec3 bn = normalize(vec3(0.42, 0.78, -0.46));
    float mw = exp(-pow(dot(d, bn) * 3.4, 2.0));
    float cl = fbm3(d * 6.5);
    float dust = fbm3(d * 13.0 + vec3(11.7));
    float glow = mw * (0.10 + 1.90 * smoothstep(0.34, 0.70, cl)) * (1.0 - 0.97 * smoothstep(0.44, 0.58, dust) * mw);
    glow *= 1.0 - 0.45 * smoothstep(0.55, 0.78, n3(d * 26.0 + vec3(5.2))) * mw;
    float core = pow(max(dot(d, normalize(vec3(-0.55, 0.20, 0.81))), 0.0), 3.0);
    vec3 col = vec3(0.030, 0.048, 0.105) * glow;
    col += vec3(0.150, 0.095, 0.200) * glow * cl * 1.15;
    col += vec3(0.220, 0.155, 0.100) * glow * core * 0.85;
    col += vec3(0.045, 0.090, 0.130) * pow(mw, 3.0) * 0.45;
    col += vec3(0.30, 0.10, 0.38) * mw * smoothstep(0.60, 0.82, cl) * 0.9;
    float bandBoost = 0.35 + 0.65 * mw;
    col += vec3(0.85, 0.90, 1.0) * starLayer(d, 90.0, 0.922) * 2.6 * bandBoost;
    col += vec3(1.0, 0.88, 0.74) * starLayer(d, 160.0, 0.936) * 1.9 * bandBoost;
    col += vec3(0.80, 0.86, 1.0) * starLayer(d, 240.0, 0.950) * 1.3 * bandBoost;
    gl_FragColor = vec4(col * 0.85 * uMilky, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* 28 步视线积分 + 指数密度大气。标高/散射强度可调，适配近地掠射视角。 */
const atmosphereFragment = /* glsl */`
  uniform vec3 uCameraLocal, uSunLocal;
  uniform float uScaleHeight, uScatter, uOuter;
  varying vec3 vLocal;
  vec2 hit(vec3 o, vec3 d, float r){
    float b = dot(o, d), c = dot(o, o) - r * r, disc = b * b - c;
    if (disc < 0.0) return vec2(1e5, -1e5);
    float s = sqrt(disc); return vec2(-b - s, -b + s);
  }
  void main(){
    vec3 ray = normalize(vLocal - uCameraLocal);
    vec2 outer = hit(uCameraLocal, ray, uOuter);
    vec2 inner = hit(uCameraLocal, ray, 1.0);
    float start = max(outer.x, 0.0), end = outer.y;
    if (inner.x > 0.0 && inner.x < end) end = inner.x;
    float stepLen = max(end - start, 0.0) / 28.0;
    float optical = 0.0, lit = 0.0;
    for (int i = 0; i < 28; i++){
      vec3 p = uCameraLocal + ray * (start + (float(i) + 0.5) * stepLen);
      float h = max(length(p) - 1.0, 0.0);
      float density = exp(-h / uScaleHeight);
      float sun = smoothstep(-0.15, 0.15, dot(normalize(p), uSunLocal));
      optical += density * stepLen;
      lit += density * stepLen * sun;
    }
    float mu = dot(ray, uSunLocal);
    float phase = 0.75 * (1.0 + mu * mu);
    vec3 scatter = vec3(0.075, 0.34, 0.85) * lit * uScatter * phase;
    scatter += vec3(0.008, 0.025, 0.065) * optical;
    gl_FragColor = vec4(scatter, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const starVertex = /* glsl */`
  attribute float aSize; attribute vec3 aColor; attribute float aPhase;
  uniform float uTime;
  varying vec3 vColor;
  void main(){
    vColor = aColor * (0.78 + 0.22 * sin(uTime * (0.6 + aPhase * 1.7) + aPhase * 40.0));
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize;
    gl_Position = projectionMatrix * mv;
  }
`;
const starFragment = /* glsl */`
  varying vec3 vColor;
  void main(){
    vec2 d = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.06, length(d));
    gl_FragColor = vec4(vColor, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createEarth() {
  const group = new THREE.Group();
  // 初始自转相位：星下点落在东亚/西太平洋，避免首屏正对空旷中太平洋
  group.rotation.y = 2.79;
  const loader = new THREE.TextureLoader();
  const day = loader.load('textures/earth-day-4k.jpg');
  const clouds = loader.load('textures/earth-clouds-2k.jpg');
  const stormTex = loader.load('textures/storm-sat.png');
  day.colorSpace = THREE.SRGBColorSpace;
  clouds.colorSpace = THREE.NoColorSpace;
  stormTex.colorSpace = THREE.NoColorSpace;
  for (const t of [day, clouds]) { t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; }
  stormTex.anisotropy = 8;
  const night = tex(nightTexture());
  night.wrapS = THREE.RepeatWrapping;

  const sun = SUN_BASE.clone();

  /* 云场共享 uniform：地表云影与云顶体积光照必须读同一份场 */
  const sharedU = {
    uClouds: { value: clouds }, uStormTex: { value: stormTex }, uTime: { value: 0 }, uStorm: { value: 0.8 },
    uSunLeft: { value: 1 },
    uStormCenter: { value: new THREE.Vector2(0.8127, 0.4738) }, uCloudOffset: { value: 0 },
  };
  /* 气旋锁定视野：中心随自转补偿，主视觉台风不会漂出画面 */
  const stormU0 = new THREE.Vector2(0.8127, 0.4738);
  const rot0 = group.rotation.y;
  const surfaceU = {
    ...sharedU,
    uDay: { value: day }, uNight: { value: night },
    uSun: { value: sun }, uShadowLen: { value: 0.004 },
    uNightGain: { value: 1.15 },
  };
  const cloudU = { ...sharedU, uSun: { value: sun }, uCover: { value: 1 }, uRelief: { value: 1 } };
  const skyU = { uMilky: { value: 1 }, uTime: sharedU.uTime };
  const atmoU = {
    uCameraLocal: { value: new THREE.Vector3() }, uSunLocal: { value: new THREE.Vector3() },
    uScaleHeight: { value: 0.0026 }, uScatter: { value: 3.4 }, uOuter: { value: 1.012 },
  };

  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(1, 160, 120),
    new THREE.ShaderMaterial({ vertexShader: planetVertex, fragmentShader: surfaceFragment, uniforms: surfaceU })
  );
  const cloudMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.0016, 128, 96),
    new THREE.ShaderMaterial({
      vertexShader: planetVertex, fragmentShader: cloudsFragment, uniforms: cloudU,
      transparent: true, depthWrite: false,
    })
  );
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(1.012, 128, 96),
    new THREE.ShaderMaterial({
      vertexShader: planetVertex, fragmentShader: atmosphereFragment, uniforms: atmoU,
      side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(25, 48, 32),
    new THREE.ShaderMaterial({
      vertexShader: planetVertex, fragmentShader: skyFragment, uniforms: skyU,
      side: THREE.BackSide, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    })
  );
  sky.renderOrder = -20;
  sky.frustumCulled = false;
  atmo.renderOrder = 3;
  cloudMesh.renderOrder = 2;
  group.add(surface, cloudMesh, atmo);

  /* 星空：亮星点精灵 + 银河球内的未解析星尘 */
  const N = 13000, rnd = mulberry(4242);
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), siz = new Float32Array(N), pha = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), R = 15;
    pos[i * 3] = s * Math.cos(th) * R; pos[i * 3 + 1] = u * R; pos[i * 3 + 2] = s * Math.sin(th) * R;
    const t = rnd(), warm = t > .82, cool = t < .18;
    const b = .40 + Math.pow(rnd(), 2.2) * .60;
    col[i * 3] = b * (warm ? 1 : cool ? .78 : .92);
    col[i * 3 + 1] = b * (warm ? .86 : cool ? .86 : .94);
    col[i * 3 + 2] = b * (warm ? .7 : cool ? 1 : .98);
    siz[i] = .9 + Math.pow(rnd(), 3) * 3.2;
    pha[i] = rnd();
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  starGeo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(pha, 1));
  const stars = new THREE.Points(starGeo, new THREE.ShaderMaterial({
    vertexShader: starVertex, fragmentShader: starFragment, uniforms: { uTime: sharedU.uTime },
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
  }));
  stars.renderOrder = -10;
  stars.frustumCulled = false;

  /* 太阳辉光：核心 + 六向星芒 + 横向变形宽银幕拉丝 */
  const glowCv = cv(512, 512);
  const gg = glowCv[1];
  const grd = gg.createRadialGradient(256, 256, 0, 256, 256, 256);
  grd.addColorStop(0, 'rgba(255,252,244,1)');
  grd.addColorStop(.06, 'rgba(255,246,224,.95)');
  grd.addColorStop(.18, 'rgba(255,228,182,.38)');
  grd.addColorStop(.45, 'rgba(255,214,160,.10)');
  grd.addColorStop(1, 'rgba(255,220,170,0)');
  gg.fillStyle = grd; gg.fillRect(0, 0, 512, 512);
  gg.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + .35, len = i % 2 ? 150 : 240;
    gg.save(); gg.translate(256, 256); gg.rotate(a);
    const lg = gg.createLinearGradient(0, 0, len, 0);
    lg.addColorStop(0, 'rgba(255,240,210,.5)'); lg.addColorStop(1, 'rgba(255,220,170,0)');
    gg.fillStyle = lg; gg.beginPath(); gg.moveTo(0, -3.5); gg.lineTo(len, 0); gg.lineTo(0, 3.5); gg.closePath(); gg.fill();
    gg.restore();
  }
  gg.save(); gg.translate(256, 256); gg.scale(1, .05);
  const hg = gg.createRadialGradient(0, 0, 0, 0, 0, 250);
  hg.addColorStop(0, 'rgba(255,238,205,.55)'); hg.addColorStop(1, 'rgba(255,220,170,0)');
  gg.fillStyle = hg; gg.beginPath(); gg.arc(0, 0, 250, 0, Math.PI * 2); gg.fill(); gg.restore();
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex(glowCv[0]), transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.AdditiveBlending, opacity: 1,
  }));
  sunSprite.scale.setScalar(9.0);
  sunSprite.renderOrder = -9;

  const inv = new THREE.Matrix4();
  const params = {
    spin: 0.004, cloudRel: 0.0012, cover: 1, scatter: 3.4, scaleHeight: 0.0026,
    starDensity: 1, sunAz: 0, relief: 1, milky: 1, storm: 0.8,
  };
  let cloudAngle = 0.01;

  function setSunAzimuth(deg) {
    params.sunAz = deg;
    sharedU.uSunLeft.value = 1 - THREE.MathUtils.smoothstep(deg, -40, 10);
    const a = deg * Math.PI / 180;
    sun.copy(SUN_BASE).applyAxisAngle(new THREE.Vector3(0, 1, 0), a).normalize();
    sunSprite.position.copy(sun).multiplyScalar(14);
  }
  setSunAzimuth(0);

  function update(dt, timeScale, camera, spin = true) {
    if (spin) {
      group.rotation.y += params.spin * dt * timeScale;
      cloudAngle += params.cloudRel * dt * timeScale;
    }
    sharedU.uTime.value += dt;
    /* 云层随地球自转 + 微小相对漂移；offset 用 uv 单位，气旋才能锚定地理坐标 */
    cloudMesh.rotation.y = cloudAngle;
    sharedU.uCloudOffset.value = -cloudAngle / (Math.PI * 2);
    sharedU.uStormCenter.value.set(stormU0.x + (group.rotation.y - rot0) / (Math.PI * 2), stormU0.y);
    cloudU.uCover.value = params.cover;
    cloudU.uRelief.value = params.relief;
    sharedU.uStorm.value = params.storm;
    skyU.uMilky.value = params.milky;
    atmoU.uScatter.value = params.scatter;
    atmoU.uScaleHeight.value = params.scaleHeight;
    inv.copy(group.matrixWorld).invert();
    atmoU.uCameraLocal.value.copy(camera.position).applyMatrix4(inv);
    atmoU.uSunLocal.value.copy(sun).transformDirection(inv);
    const zenith = Math.acos(THREE.MathUtils.clamp(sun.y, -1, 1));
    surfaceU.uShadowLen.value = 0.0096 * Math.tan(Math.min(zenith, 1.2));
    starGeo.setDrawRange(0, Math.floor(N * params.starDensity));
  }

  return { group, stars, sky, sunSprite, sun, surface, cloudMesh, atmo, params, update, setSunAzimuth, textures: { day, clouds, night } };
}