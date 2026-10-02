(() => {
  'use strict';
  const vertexSource = `
    attribute vec2 point;
    uniform vec2 viewport;
    uniform vec2 tile;
    varying vec2 uv;
    void main() {
      uv = point;
      gl_Position = vec4((tile.x + point.x * tile.y) / viewport.x * 2.0 - 1.0,
        1.0 - point.y * 2.0, 0.0, 1.0);
    }`;
  const fragmentSource = `
    precision highp float;
    uniform sampler2D scene;
    varying vec2 uv;
    void main() {
      vec4 color = texture2D(scene, uv);
      gl_FragColor = vec4(color.rgb, clamp(uv.x / 0.14, 0.0, 1.0));
    }`;

  class SeaRenderer {
    constructor(canvas, images) {
      this.canvas = canvas;
      this.images = images;
      this.gl = canvas.getContext('webgl', { alpha: false, antialias: false,
        depth: false, stencil: false, preserveDrawingBuffer: false });
      if (this.gl) this.initializeGL();
      else this.initialize2D();
    }
    initializeGL() {
      const gl = this.gl;
      const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      const vs = compile(gl.VERTEX_SHADER, vertexSource);
      const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
      this.program = gl.createProgram();
      gl.attachShader(this.program, vs); gl.attachShader(this.program, fs);
      gl.linkProgram(this.program);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));
      gl.deleteShader(vs); gl.deleteShader(fs);
      gl.useProgram(this.program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]), gl.STATIC_DRAW);
      const point = gl.getAttribLocation(this.program, 'point');
      gl.enableVertexAttribArray(point); gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
      this.uniforms = Object.fromEntries(['viewport','tile','scene'].map(name => [name, gl.getUniformLocation(this.program,name)]));
      gl.activeTexture(gl.TEXTURE0); gl.uniform1i(this.uniforms.scene, 0);
      this.textures = this.images.map(img => {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        return texture;
      });
      gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0.07,0.55,0.66,1);
    }
    initialize2D() {
      this.ctx = this.canvas.getContext('2d', { alpha: false });
      this.fades = this.images.map(img => {
        const strip = document.createElement('canvas');
        strip.width = Math.round(img.naturalWidth * 0.14); strip.height = img.naturalHeight;
        const c = strip.getContext('2d'); c.drawImage(img,0,0);
        c.globalCompositeOperation = 'destination-in';
        const fade = c.createLinearGradient(0,0,strip.width,0);
        fade.addColorStop(0,'transparent'); fade.addColorStop(1,'#000');
        c.fillStyle = fade; c.fillRect(0,0,strip.width,strip.height);
        return strip;
      });
    }
    resize(width,height) {
      this.width = width; this.height = height;
      // Match the scene to CSS pixels. Retina supersampling adds no useful detail
      // to these backgrounds but more than doubles the per-frame pixel workload.
      this.ratio = 1;
      this.canvas.width = Math.round(width * this.ratio);
      this.canvas.height = Math.round(height * this.ratio);
      if (this.gl) this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
      else {
        this.ctx.setTransform(this.ratio,0,0,this.ratio,0,0);
      }
    }
    draw(position) {
      const w = this.width, h = this.height;
      if (!w || !h) return;
      const tw = h * this.images[0].naturalWidth / this.images[0].naturalHeight;
      const step = tw * 0.86, offset = position * step;
      const first = Math.floor((offset - tw) / step) + 1;
      const last = Math.ceil((offset + w) / step) - 1;
      const gl = this.gl;
      if (gl) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(this.uniforms.viewport,w,h);
      }
      for (let n=first;n<=last;n++) {
        // Continue with quiet reef scenery outside the finite route, never another station.
        const i = n < 0 ? 1 : n >= this.images.length ? this.images.length - 2 : n;
        const x = n * step - offset;
        if (gl) {
          gl.bindTexture(gl.TEXTURE_2D,this.textures[i]);
          gl.uniform2f(this.uniforms.tile,x,tw);
          gl.drawArrays(gl.TRIANGLES,0,6);
        } else {
          const img=this.images[i], strip=this.fades[i], fw=tw*strip.width/img.naturalWidth;
          this.ctx.drawImage(strip,x,0,fw,h);
          this.ctx.drawImage(img,strip.width,0,img.naturalWidth-strip.width,img.naturalHeight,x+fw,0,tw-fw+0.25,h);
        }
      }
    }
  }
  window.SeaRenderer = SeaRenderer;
})();
