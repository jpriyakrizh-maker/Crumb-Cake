"use client";
const VERT = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;
const HEAD = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime, uVel, uProgress;
uniform vec2 uRes;
uniform sampler2D uTex0, uTex1, uTex2, uTex3;
uniform vec2 uTexRes0, uTexRes1, uTexRes2, uTexRes3;
vec2 cover(vec2 uv, vec2 texRes) {
  vec2 s = uRes / texRes;
  float k = max(s.x, s.y);
  vec2 size = texRes * k;
  return (uv * uRes + (size - uRes) * 0.5) / size;
}
`;
/** Scroll speed from Lenis (or window scroll), smoothed, roughly -1..1. */
function velocitySource() {
  let last = window.scrollY;
  let v = 0;
  return () => {
    const lenis = window.__lenis;
    const raw = lenis ? lenis.velocity : window.scrollY - last;
    last = window.scrollY;
    v += (Math.max(-60, Math.min(60, raw)) / 60 - v) * 0.12;
    return v;
  };
}
export async function createShader(canvas, fragment, { textures = [], uniforms = {}, dpr = 1.5, onFrame, init, } = {}) {
  try {
    const ogl = await import("ogl");
    const { Renderer, Program, Mesh, Triangle, Texture } = ogl;
    const renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, dpr), alpha: true, antialias: false, premultipliedAlpha: false });
    const gl = renderer.gl;
    if (!gl)
      return null;
    const texs = [0, 1, 2, 3].map(() => new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE }));
    const u = {
      uTime: { value: 0 },
      uVel: { value: 0 },
      uProgress: { value: 0 },
      uRes: { value: [1, 1] },
      ...Object.fromEntries(texs.map((t, i) => [`uTex${i}`, { value: t }])),
      ...Object.fromEntries(texs.map((_, i) => [`uTexRes${i}`, { value: [1, 1] }])),
      ...uniforms,
    };
    const setTexture = (i, src) => {
      texs[i].image = src;
      const w = src.naturalWidth || src.width;
      const h = src.naturalHeight || src.height;
      u[`uTexRes${i}`].value = [w, h];
    };
    textures.forEach((t, i) => setTexture(i, t));
    const step = init?.({ ogl, gl: gl, uniforms: u }) || undefined;
    const program = new Program(gl, { vertex: VERT, fragment: HEAD + fragment, uniforms: u, transparent: true });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    // size from the PARENT box (OGL writes a fixed px size onto the canvas; keep it at 100% so it always fills)
    const box = canvas.parentElement ?? canvas;
    const resize = () => {
      const r = box.getBoundingClientRect();
      renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      u.uRes.value = [gl.canvas.width, gl.canvas.height];
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" });
    io.observe(canvas);
    const vel = velocitySource();
    const t0 = performance.now();
    let raf = 0;
    let shown = false;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const v = vel();
      if (!visible)
        return;
      const t = (performance.now() - t0) / 1000;
      u.uTime.value = t;
      u.uVel.value = v;
      onFrame?.(u, t);
      step?.(t);
      renderer.render({ scene: mesh });
      if (!shown) {
        shown = true;
        canvas.style.opacity = "1"; // the fallback underneath can now be covered
      }
    };
    raf = requestAnimationFrame(loop);
    return {
      uniforms: u,
      setTexture,
      destroy: () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      },
    };
  }
  catch (err) {
    console.warn("[gl] WebGL effect off, showing the fallback:", err.message);
    return null;
  }
}
/** Loads an image for a texture (resolves with the element, or null on error). */
export const loadImage = (src) => new Promise((res) => {
  const img = new Image();
  img.decoding = "async";
  img.onload = () => res(img);
  img.onerror = () => res(null);
  img.src = src;
});
