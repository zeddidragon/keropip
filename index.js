(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Bird, makeZ, resources, validMoves;

resources = require('../resources');

makeZ = require('../utils/make-z');

validMoves = require('../utils/valid-moves');

module.exports = Bird = class Bird {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.type = 'player';
    this.geometry = resources.geometry.bird;
    this.material = [resources.material.bird_arms, resources.material.bird_face, resources.material.frog_rim, resources.material.frog_face, resources.material.bird_beak, resources.material.frog_eye];
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.state = 'idle';
    this.nextMove = null;
    this.from = new THREE.Vector3;
    this.to = new THREE.Vector3;
    this.progress = 0;
    this.rollVector = new THREE.Vector3;
  }

  init() {
    this.onKeyDown = (event) => {
      var key;
      key = event.key.toLowerCase();
      if ('adswexz'.includes(key)) {
        this.nextMove = key;
      }
      if (key === 'y') {
        this.nextMove = 'z';
      }
    };
    return document.addEventListener('keydown', this.onKeyDown);
  }

  deinit() {
    return document.removeEventListener('keydown', this.onKeyDown);
  }

  update(state) {
    var name;
    return typeof this[name = this.state] === "function" ? this[name](state) : void 0;
  }

  idle(state) {
    var move;
    if (this.nextMove) {
      move = validMoves[state.level.mode][this.nextMove];
      this.nextMove = null;
      if (!(move && this.canMove(state, move))) {
        return;
      }
      this.from.set(this.x, -this.y, 0);
      this.x += move.x;
      this.y += move.y;
      this.to.set(this.x, -this.y, 0);
      this.progress = 0;
      this.rollVector.set(move.y, move.x, 0).normalize();
      state.sfx.play(`sweep${4 * Math.random() | 1}`);
      this.state = 'moving';
    }
  }

  canMove(state, move) {
    var ref;
    return ((ref = state.level.tiles[this.y + move.y]) != null ? ref[this.x + move.x] : void 0) !== "#";
  }

  moving(state) {
    this.progress += 0.14;
    if (this.progress < 2) {
      this.mesh.rotateOnWorldAxis(this.rollVector, 0.24 * Math.cos(this.progress));
      this.mesh.position.lerpVectors(this.from, this.to, 1.1 * Math.sin(this.progress));
    } else {
      this.mesh.position.copy(this.to);
      this.state = 'idle';
    }
    return this.mesh.position.z = makeZ[state.level.mode](this.mesh.position);
  }

};


},{"../resources":9,"../utils/make-z":10,"../utils/valid-moves":11}],2:[function(require,module,exports){
var CameraController, tmpVec;

tmpVec = new THREE.Vector3;

module.exports = CameraController = class CameraController {
  constructor(camera, player) {
    this.camera = camera;
    this.player = player;
    this.state = 'tracking';
    this.offset = new THREE.Vector3(0, 0, 16);
    this.from = new THREE.Vector3;
    this.to = new THREE.Vector3;
    this.progress = 0;
  }

  warp(state, mode) {
    this.state = 'warping';
    this.from.copy(this.offset);
    this.progress = 0;
    state.level.mode = mode;
    state.sfx.play('warp');
    switch (mode) {
      case 'orto':
        this.to.set(0, 0, 16);
        break;
      case 'hex':
        this.to.set(16, -16, 16);
    }
  }

  tracking() {
    if (this.player.state === 'goal') {
      return;
    }
    tmpVec.addVectors(this.player.mesh.position, this.offset);
    this.camera.position.lerp(tmpVec, 0.2);
    return this.camera.lookAt(this.player.mesh.position);
  }

  warping() {
    this.progress += 0.03;
    if (this.progress < 1) {
      this.offset.lerpVectors(this.from, this.to, this.progress);
    } else {
      this.offset.copy(this.to);
      this.state = 'tracking';
    }
    return this.tracking();
  }

  update(state) {
    var name;
    return typeof this[name = this.state] === "function" ? this[name](state) : void 0;
  }

};


},{}],3:[function(require,module,exports){
var Goal, Particle, resources;

resources = require('../resources');

Particle = class Particle {
  constructor(pos, vel) {
    this.pos = pos;
    this.vel = vel;
  }

};

module.exports = Goal = class Goal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.state = 'idle';
    this.geometry = resources.geometry.goal;
    this.material = resources.material.goal;
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.particles = [];
  }

  update(state) {
    var name;
    return typeof this[name = this.state] === "function" ? this[name](state) : void 0;
  }

  idle(state) {
    var biasX, biasY, e, height, i, j, len, len1, oldCamera, ref, ref1, scene, vec, width;
    if (!(state.player.x === this.x && state.player.y === this.y)) {
      return;
    }
    state.player.state = 'goal';
    this.state = 'reached';
    state.sfx.play('explosion');
    oldCamera = state.camera;
    ({width, height} = state.level);
    ref = state.level.scenes;
    for (i = 0, len = ref.length; i < len; i++) {
      scene = ref[i];
      ref1 = scene.children;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        e = ref1[j];
        biasX = e.position.x / width - 0.5;
        biasY = e.position.y / height - 0.5;
        vec = new THREE.Vector3(Math.random() + biasX, Math.random() + biasY, -Math.random());
        this.particles.push(new Particle(e.position, vec));
      }
    }
    setTimeout(state.next, 1000);
    return setTimeout((function() {
      return state.done = true;
    }), 5000);
  }

  reached(state) {
    var i, len, p, ref;
    ref = this.particles;
    for (i = 0, len = ref.length; i < len; i++) {
      p = ref[i];
      p.vel.z -= 0.08;
      p.vel.multiplyScalar(0.94);
      p.pos.add(p.vel);
    }
  }

};


},{"../resources":9}],4:[function(require,module,exports){
var ModePad, charModes, resources;

resources = require('../resources');

charModes = {
  H: 'hex',
  O: 'orto',
  D: 'diag'
};

module.exports = ModePad = class ModePad {
  constructor(x, y, char) {
    this.x = x;
    this.y = y;
    this.type = 'mode-pad';
    this.mode = charModes[char];
    this.geometry = resources.geometry[`${this.mode}_pad`];
    this.material = resources.material[`${this.mode}_pad`];
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.rollVector = new THREE.Vector3(1, 0.5, 2).normalize();
  }

  update(state) {
    this.mesh.rotateOnWorldAxis(this.rollVector, 0.05);
    if (state.level.mode === this.mode) {
      return;
    }
    if (!(state.player.x === this.x && state.player.y === this.y)) {
      return;
    }
    return state.cameraController.warp(state, this.mode);
  }

};


},{"../resources":9}],5:[function(require,module,exports){
var TouchInput, makeZ, resources, rotate, tmp, validMoves;

resources = require('../resources');

makeZ = require('../utils/make-z');

validMoves = require('../utils/valid-moves');

tmp = new THREE.Vector3;

rotate = {
  orto: function(vec) {
    var x, y;
    ({x, y} = vec);
    vec.x = -y;
    return vec.y = x;
  },
  hex: function(vec) {
    var x, y, z;
    ({x, y, z} = vec);
    vec.x = -y;
    vec.y = -z;
    return vec.z = -x;
  }
};

module.exports = TouchInput = class TouchInput {
  constructor() {
    var block, i, j;
    this.geometry = resources.geometry.block;
    this.material = resources.material.highlight_block;
    this.meshes = [];
    for (i = j = 1; j <= 6; i = ++j) {
      block = new THREE.Mesh(this.geometry, this.material);
      this.meshes.push(block);
    }
    this.touch = false;
    this.x = 0;
    this.y = 0;
  }

  init({element}) {
    this.onTouch = (event) => {
      var ref, touch;
      if (event.button) {
        return;
      }
      touch = ((ref = event.changedTouches) != null ? ref[0] : void 0) || event;
      this.touch = true;
      this.x = event.x;
      this.y = event.y;
      return console.log('touched', {
        x: this.x,
        y: this.y
      });
    };
    return element.addEventListener('click', this.onTouch);
  }

  deinit({element}) {
    return element.removeEventListener('click', this.onTouch);
  }

  update(state) {
    var block, i, j, len, mode, ref, show;
    tmp.set(0, -1, 1);
    mode = state.level.mode;
    show = state.player.state !== 'goal';
    ref = this.meshes;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      block = ref[i];
      if (show && (i < 4 || mode === 'hex') && state.player.canMove(state, tmp)) {
        block.position.set(state.player.x, state.player.y, 0).add(tmp);
        block.position.y = -block.position.y;
        block.position.z = makeZ[state.level.mode](block.position);
        block.visible = true;
      } else {
        block.visible = false;
      }
      rotate[state.level.mode](tmp);
    }
  }

};


},{"../resources":9,"../utils/make-z":10,"../utils/valid-moves":11}],6:[function(require,module,exports){
var Warper, makeZ;

makeZ = require('../utils/make-z');

module.exports = Warper = class Warper {
  constructor() {
    this.mode = 'orto';
    this.progress = 1;
  }

  update(state) {
    var e, i, j, len, len1, ref, ref1, scene;
    if (state.level.mode !== this.mode) {
      this.progress = 0;
      this.mode = state.level.mode;
      ref = state.level.scenes;
      for (i = 0, len = ref.length; i < len; i++) {
        scene = ref[i];
        ref1 = scene.children;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          e = ref1[j];
          e.position.z = makeZ[this.mode](e.position);
        }
      }
    }
  }

};


},{"../utils/make-z":10}],7:[function(require,module,exports){
var CameraController, animate, init, level, renderer, resources, startLevel, states;

CameraController = require('./entities/camera-controller');

resources = require('./resources');

level = require('./level');

states = [];

startLevel = function(n) {
  return fetch(`level${n}`).then(function(res) {
    return res.text();
  }).then(level).then(function(lv) {
    return states.push(init(lv, n));
  });
};

resources.loaded(function() {
  return startLevel(1);
});

renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.autoClear = false;

init = function(level, num) {
  var camera, cameraController, entity, j, len, onResize, ref, state;
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 2048);
  camera.position.z = 16;
  camera.position.x = -1000;
  camera.position.y = -1000;
  cameraController = new CameraController(camera, level.player);
  level.entities.push(cameraController);
  onResize = function() {
    var height, ratio, size, width;
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height);
    size = Math.max(6, Math.max(level.width, level.height) / 2);
    if (width > height) {
      ratio = width / height;
      height = size;
      width = size * ratio;
    } else {
      ratio = height / width;
      width = size;
      height = size * ratio;
    }
    camera.aspect = width / height;
    return camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  onResize();
  if (!renderer.domElement.parentElement) {
    document.body.appendChild(renderer.domElement);
  }
  window.block = resources.geometry.block;
  state = {
    done: false,
    level: level,
    levelNumber: num,
    player: level.player,
    camera: camera,
    resources: resources,
    sfx: resources.sfx.sfx,
    cameraController: cameraController,
    renderer: renderer,
    element: renderer.domElement,
    next: function() {
      startLevel(num + 1);
      return window.removeEventListener('resize', onResize);
    }
  };
  ref = level.entities;
  for (j = 0, len = ref.length; j < len; j++) {
    entity = ref[j];
    if (typeof entity.init === "function") {
      entity.init(state);
    }
  }
  window.$state = state;
  return state;
};

animate = function() {
  var ent, entity, i, j, k, l, len, len1, len2, ref, ref1, ref2, results, scene, state;
  if ((ref = states[0]) != null ? ref.done : void 0) {
    state = states.shift();
    ref1 = state.level.entities;
    for (j = 0, len = ref1.length; j < len; j++) {
      entity = ref1[j];
      if (typeof entity.deinit === "function") {
        entity.deinit(state);
      }
    }
  }
  requestAnimationFrame(animate);
  renderer.clear();
  results = [];
  for (k = 0, len1 = states.length; k < len1; k++) {
    state = states[k];
    ref2 = state.level.scenes;
    for (i = l = 0, len2 = ref2.length; l < len2; i = ++l) {
      scene = ref2[i];
      if (i) {
        renderer.clearDepth();
      }
      renderer.render(scene, state.camera);
    }
    results.push((function() {
      var len3, m, ref3, results1;
      ref3 = state.level.entities;
      results1 = [];
      for (m = 0, len3 = ref3.length; m < len3; m++) {
        ent = ref3[m];
        results1.push(typeof ent.update === "function" ? ent.update(state) : void 0);
      }
      return results1;
    })());
  }
  return results;
};

requestAnimationFrame(animate);


},{"./entities/camera-controller":2,"./level":8,"./resources":9}],8:[function(require,module,exports){
var Bird, Goal, ModePad, TouchInput, Warper, createEntity, createScene, entityMap, level, resources;

TouchInput = require('./entities/touch-input');

ModePad = require('./entities/mode-pad');

Warper = require('./entities/warper');

Bird = require('./entities/bird');

Goal = require('./entities/goal');

resources = require('./resources');

level = function(str) {
  var entities, player, tiles;
  entities = [new Warper, new TouchInput];
  player = null;
  tiles = str.split("\n").map(function(str) {
    return str.trim().split("");
  }).map(function(row, j) {
    return row.map(function(char, i) {
      var e;
      e = createEntity(char, i, j);
      if (e) {
        entities.push(e);
        if (e.type === 'player') {
          player = e;
        }
        e.x = i;
        return e.y = j;
      } else {
        return char;
      }
    });
  });
  return {
    mode: 'orto',
    width: tiles[0].length,
    height: tiles.length,
    entities: entities,
    tiles: tiles,
    player: player,
    scenes: createScene(tiles, entities)
  };
};

module.exports = level;

entityMap = {
  '@': Bird,
  'H': ModePad,
  'O': ModePad,
  'D': ModePad,
  '!': Goal
};

createEntity = function(char, x, y) {
  var entity, klass;
  klass = entityMap[char];
  if (!klass) {
    return;
  }
  entity = new klass(x, y, char);
  return entity;
};

createScene = function(tiles, entities) {
  var addMesh, block, e, entityScene, geometry, ground, i, j, k, l, len, len1, len2, len3, len4, m, mesh, n, o, ref, row, solid, tile, tileScene;
  geometry = resources.geometry.block;
  ground = resources.material.block;
  solid = resources.material.block2;
  tileScene = new THREE.Scene;
  entityScene = new THREE.Scene;
  for (j = k = 0, len = tiles.length; k < len; j = ++k) {
    row = tiles[j];
    for (i = l = 0, len1 = row.length; l < len1; i = ++l) {
      tile = row[i];
      block = new THREE.Mesh(geometry, tile === '#' ? solid : ground);
      block.position.x = i;
      block.position.y = -j;
      tileScene.add(block);
    }
  }
  addMesh = function(e, mesh) {
    mesh.position.x = e.x;
    mesh.position.y = -e.y;
    mesh.name = e.type;
    return entityScene.add(mesh);
  };
  for (m = 0, len2 = entities.length; m < len2; m++) {
    e = entities[m];
    if (e.mesh) {
      addMesh(e, e.mesh);
    }
  }
  for (n = 0, len3 = entities.length; n < len3; n++) {
    e = entities[n];
    if (e.meshes) {
      ref = e.meshes;
      for (o = 0, len4 = ref.length; o < len4; o++) {
        mesh = ref[o];
        addMesh(e, mesh);
      }
    }
  }
  return [tileScene, entityScene];
};


},{"./entities/bird":1,"./entities/goal":3,"./entities/mode-pad":4,"./entities/touch-input":5,"./entities/warper":6,"./resources":9}],9:[function(require,module,exports){
var bgmNode, callback, isLoaded, load, loadCounter, loaded, loaders, resources, tmpMat;

bgmNode = document.getElementById('bgm');

bgmNode.volume = 0.5;

tmpMat = new THREE.Matrix4;

loadCounter = 0;

resources = {
  sfx: {
    bgm: bgmNode
  },
  geometry: {
    block: (function() {
      var block;
      block = new THREE.BoxGeometry(1, 1, 1);
      block.faceVertexUvs[0][0][0].x = 1;
      block.faceVertexUvs[0][0][1].x = 1;
      block.faceVertexUvs[0][0][2].x = 0;
      block.faceVertexUvs[0][1][0].x = 1;
      block.faceVertexUvs[0][1][1].x = 0;
      block.faceVertexUvs[0][1][2].x = 0;
      block.faceVertexUvs[0][6][0].y = 0;
      block.faceVertexUvs[0][6][1].y = 1;
      block.faceVertexUvs[0][6][2].y = 0;
      block.faceVertexUvs[0][7][0].y = 1;
      block.faceVertexUvs[0][7][1].y = 1;
      block.faceVertexUvs[0][7][2].y = 0;
      block.uvsNeedUpdate = true;
      return block;
    })(),
    hex_pad: new THREE.CircleGeometry(0.5, 6),
    orto_pad: new THREE.PlaneGeometry(0.8, 0.8, 1, 1),
    goal: (function() {
      var dot, line;
      dot = new THREE.SphereGeometry(0.12, 6, 6);
      tmpMat.makeTranslation(0, -0.4, 0);
      dot.applyMatrix(tmpMat);
      line = new THREE.CylinderGeometry(0.18, 0.10, 0.6, 6);
      tmpMat.makeTranslation(0, 0.1, 0);
      line.applyMatrix(tmpMat);
      dot.merge(line);
      return dot;
    })()
  },
  material: {
    bird_arms: new THREE.MeshBasicMaterial({
      color: 0xffff00
    }),
    bird_beak: new THREE.MeshBasicMaterial({
      color: 0xffaa00
    }),
    frog_rim: new THREE.MeshBasicMaterial({
      color: 0x84c914
    }),
    hex_pad: new THREE.MeshBasicMaterial({
      color: 0x66ddff,
      transparent: true,
      opacity: 0.7
    }),
    orto_pad: new THREE.MeshBasicMaterial({
      color: 0xff6666,
      transparent: true,
      opacity: 0.7
    }),
    goal: new THREE.MeshBasicMaterial({
      color: 0xf0e68c,
      transparent: true,
      opacity: 0.7
    }),
    highlight_block: new THREE.MeshBasicMaterial({
      color: 0x3355ff,
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    })
  }
};

loaders = {
  geometry: new THREE.JSONLoader,
  material: new THREE.TextureLoader,
  sfx: {
    load: function(path, cb) {
      return fetch(path).then(function(response) {
        return response.json();
      }).then(function(settings) {
        var player;
        settings.preload = true;
        player = new Howl(settings);
        return player.once('load', function() {
          return cb(player);
        });
      });
    }
  }
};

load = function(type, path, transforms) {
  ++loadCounter;
  return loaders[type].load("assets/" + path, function(obj) {
    var args, i, len, name, ref, transform;
    name = path.split('/').pop().split('.').shift();
    if (type === 'material') {
      obj = new THREE.MeshBasicMaterial({
        map: obj
      });
    }
    ref = transforms || [];
    for (i = 0, len = ref.length; i < len; i++) {
      [transform, args] = ref[i];
      obj[transform](...args);
    }
    resources[type][name] = obj;
    return loaded();
  });
};

isLoaded = false;

callback = null;

loaded = function() {
  if (--loadCounter) {
    return;
  }
  isLoaded = true;
  return requestAnimationFrame(function() {
    return typeof callback === "function" ? callback(resources) : void 0;
  });
};

resources.loaded = function(cb) {
  callback = cb;
  return requestAnimationFrame(function() {
    if (isLoaded) {
      return cb(resources);
    }
  });
};

load('geometry', 'bird/bird.json', [['translate', [0, -5, 0]], ['scale', [0.24, 0.24, 0.24]]]);

load('material', 'bird/bird_face.png');

load('material', 'bird/frog_eye.png');

load('material', 'bird/frog_face.png');

load('material', 'block.png');

load('material', 'block2.png');

load('sfx', 'sfx.json');

module.exports = resources;


},{}],10:[function(require,module,exports){
module.exports = {
  orto: function({z}) {
    return 0;
  },
  hex: function({x, y}) {
    return y - x;
  }
};


},{}],11:[function(require,module,exports){
module.exports = {
  orto: {
    w: new THREE.Vector3(0, -1, 0),
    d: new THREE.Vector3(1, 0, 0),
    s: new THREE.Vector3(0, 1, 0),
    a: new THREE.Vector3(-1, 0, 0)
  },
  hex: {
    w: new THREE.Vector3(0, -1, 0),
    e: new THREE.Vector3(1, -1, 0),
    d: new THREE.Vector3(1, 0, 0),
    x: new THREE.Vector3(0, 1, 0),
    z: new THREE.Vector3(-1, 1, 0),
    a: new THREE.Vector3(-1, 0, 0)
  }
};


},{}]},{},[7]);
