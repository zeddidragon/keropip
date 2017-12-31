(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var makeZ, moving;

makeZ = require('../utils/make-z');

moving = function(state) {
  var oldZ;
  this.progress += 0.14;
  oldZ = this.mesh.position.z;
  if (this.progress < 2) {
    this.mesh.position.lerpVectors(this.from, this.to, 1.1 * Math.sin(this.progress));
  } else {
    this.mesh.position.copy(this.to);
    this.state = 'idle';
    this.progress = 0;
  }
  this.mesh.position.z = oldZ;
  return makeZ.snap(state, this.mesh.position);
};

moving.init = function() {
  this.from = new THREE.Vector3;
  this.to = new THREE.Vector3;
  return this.progress = 0;
};

module.exports = moving;


},{"../utils/make-z":13}],2:[function(require,module,exports){
var Bird, makeZ, resources, tmp, validMoves;

resources = require('../resources');

makeZ = require('../utils/make-z');

validMoves = require('../utils/valid-moves');

tmp = new THREE.Vector3;

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
    if (typeof this[name = this.state] === "function") {
      this[name](state);
    }
    if (this.state === 'goal') {
      return;
    }
    tmp.set(this.x, -this.y, this.mesh.position.z);
    makeZ.lerp(state, tmp);
    return this.mesh.position.z = tmp.z;
  }

  idle(state) {
    var level, move, pushed;
    if (this.nextMove) {
      level = state.level;
      move = validMoves[level.mode][this.nextMove];
      this.nextMove = null;
      if (!(move && level.canMove(this, move))) {
        return;
      }
      pushed = level.entityAt(this.x + move.x, this.y + move.y);
      if ((pushed != null ? pushed.push : void 0) && !pushed.push(state, move)) {
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

  moving(state) {
    var oldZ;
    this.progress += 0.14;
    oldZ = this.mesh.position.z;
    if (this.progress < 2) {
      this.mesh.rotateOnWorldAxis(this.rollVector, 0.24 * Math.cos(this.progress));
      this.mesh.position.lerpVectors(this.from, this.to, 1.1 * Math.sin(this.progress));
    } else {
      this.mesh.position.copy(this.to);
      this.state = 'idle';
    }
    return this.mesh.position.z = oldZ;
  }

};


},{"../resources":12,"../utils/make-z":13,"../utils/valid-moves":14}],3:[function(require,module,exports){
var Box, makeZ, moving, resources, tmp, validMoves;

resources = require('../resources');

makeZ = require('../utils/make-z');

validMoves = require('../utils/valid-moves');

moving = require('../components/moving');

tmp = new THREE.Vector3;

module.exports = Box = (function() {
  class Box {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.geometry = resources.geometry.block;
      this.active = resources.material.box;
      this.passive = resources.material.box_disabled;
      this.mesh = new THREE.Mesh(this.geometry, this.active);
      this.initMoving();
      this.nextState = null;
      this.state = 'idle';
    }

    push(state, move) {
      var colliding, level, tile;
      ({level} = state);
      if (this.nextState || this.state === 'passive') {
        return true;
      }
      tile = level.tileAt(this.x + move.x, this.y + move.y);
      if (tile === '#') {
        return;
      }
      colliding = level.entityAt(this.x + move.x, this.y + move.y);
      if (colliding) {
        return;
      }
      this.state = 'moving';
      this.from.set(this.x, -this.y, 0);
      this.x += move.x;
      this.y += move.y;
      this.to.set(this.x, -this.y, 0);
      state.sfx.play(`push${4 * Math.random() | 1}`);
      if (!tile || tile === ' ') {
        this.nextState = 'passive';
        setTimeout((() => {
          return this.settle(state);
        }), 300);
      }
      state.sfx.play(`push${4 * Math.random() | 1}`);
      return true;
    }

    settle(state) {
      state.sfx.play("clang");
      state.level.setTile(this.x, this.y, 'B');
      state.level.removeEntity(this);
      state.level.scenes[0].add(this.mesh);
      return this.mesh.material = this.passive;
    }

    update(state) {
      var name;
      return typeof this[name = this.state] === "function" ? this[name](state) : void 0;
    }

  };

  Box.prototype.initMoving = moving.init;

  Box.prototype.moving = moving;

  return Box;

})();


},{"../components/moving":1,"../resources":12,"../utils/make-z":13,"../utils/valid-moves":14}],4:[function(require,module,exports){
var CameraController, LERP_FACTOR, offsets, tmpVec, ups;

({LERP_FACTOR} = require('../utils/make-z'));

tmpVec = new THREE.Vector3;

offsets = {
  orto: new THREE.Vector3(0, 0, 24),
  hex: new THREE.Vector3(16, -16, 16),
  diag: new THREE.Vector3(12, -12, 20)
};

ups = {
  orto: new THREE.Vector3(0, 1, 0),
  hex: new THREE.Vector3(0, 1, 0),
  diag: new THREE.Vector3(0, 0, 1)
};

module.exports = CameraController = class CameraController {
  constructor(camera, player) {
    this.camera = camera;
    this.player = player;
    this.state = 'tracking';
    this.offset = new THREE.Vector3().copy(offsets.orto);
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
    this.to.copy(offsets[mode]);
    return this.camera.up.copy(ups[mode]);
  }

  tracking() {
    if (this.player.state === 'goal') {
      return;
    }
    tmpVec.addVectors(this.player.mesh.position, this.offset);
    this.camera.position.lerp(tmpVec, LERP_FACTOR);
    return this.camera.lookAt(this.player.mesh.position);
  }

  warping() {
    this.progress += 0.01;
    if (this.progress < 1) {
      this.offset.lerp(this.to, LERP_FACTOR);
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


},{"../utils/make-z":13}],5:[function(require,module,exports){
var Goal, resources;

resources = require('../resources');

module.exports = Goal = class Goal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.state = 'idle';
    this.geometry = resources.geometry.goal;
    this.material = resources.material.goal;
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  update(state) {
    var name;
    return typeof this[name = this.state] === "function" ? this[name](state) : void 0;
  }

  idle(state) {
    if (!(state.player.x === this.x && state.player.y === this.y)) {
      return;
    }
    this.state = 'reached';
    return state.next();
  }

};


},{"../resources":12}],6:[function(require,module,exports){
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
    this.rollVector = new THREE.Vector3(1, 1, 0).normalize();
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


},{"../resources":12}],7:[function(require,module,exports){
var MoveIndicator, initial, makeZ, resources, rotate, tmp;

resources = require('../resources');

makeZ = require('../utils/make-z');

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

rotate.diag = rotate.orto;

initial = {
  orto: new THREE.Vector3(1, 0, 0),
  hex: new THREE.Vector3(0, 1, -1),
  diag: new THREE.Vector3(1, 1, 0)
};

module.exports = MoveIndicator = class MoveIndicator {
  constructor() {
    var block, i, j;
    this.geometry = resources.geometry.block;
    this.material = resources.material.highlight_block;
    this.meshes = [];
    for (i = j = 1; j <= 6; i = ++j) {
      block = new THREE.Mesh(this.geometry, this.material);
      this.meshes.push(block);
    }
  }

  update(state) {
    var block, i, j, len, level, mode, player, ref, show;
    ({level, player} = state);
    mode = level.mode;
    show = player.state !== 'goal';
    tmp.copy(initial[mode]);
    ref = this.meshes;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      block = ref[i];
      if (show && (i < 4 || mode === 'hex') && level.canMove(player, tmp)) {
        block.position.set(player.x, player.y, 0).add(tmp);
        block.position.y = -block.position.y;
        block.position.z = makeZ[level.mode](block.position);
        block.visible = true;
      } else {
        block.visible = false;
      }
      rotate[level.mode](tmp);
    }
  }

};


},{"../resources":12,"../utils/make-z":13}],8:[function(require,module,exports){
var TouchInput, diff, resources, tmp, tmpA, tmpB, transforms, validMoves;

resources = require('../resources');

validMoves = require('../utils/valid-moves');

tmp = new THREE.Vector3;

tmpA = new THREE.Vector3;

tmpB = new THREE.Vector3;

diff = function(a, b) {
  return a.sub(b).lengthSq();
};

transforms = {
  hex: function(vec) {
    vec.x += vec.y * 0.5;
    return vec;
  },
  diag: function(vec) {
    if (vec.x === vec.y) {
      vec.x = 0;
    } else {
      vec.y = 0;
    }
    return vec;
  }
};

module.exports = TouchInput = class TouchInput {
  constructor() {
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
      event.preventDefault();
      touch = ((ref = event.changedTouches) != null ? ref[0] : void 0) || event;
      this.touch = true;
      this.x = event.x;
      return this.y = event.y;
    };
    return element.addEventListener('click', this.onTouch);
  }

  deinit({element}) {
    return element.removeEventListener('click', this.onTouch);
  }

  update(state) {
    var mode, moves, transform;
    if (!this.touch) {
      return;
    }
    this.touch = false;
    tmp.set(this.x - window.innerWidth * 0.5, this.y - window.innerHeight * 0.5, 0).normalize();
    ({mode} = state.level);
    moves = validMoves[mode];
    transform = transforms[mode];
    return state.player.nextMove = Object.keys(moves).sort(function(a, b) {
      a = tmpA.copy(moves[a]);
      b = tmpB.copy(moves[b]);
      if (transform) {
        transform(a);
        a.normalize();
        transform(b);
        b.normalize();
      }
      return diff(a, tmp) - diff(b, tmp);
    }).shift();
  }

};


},{"../resources":12,"../utils/valid-moves":14}],9:[function(require,module,exports){
var Warper, makeZ, tmp;

makeZ = require('../utils/make-z');

tmp = new THREE.Vector3;

module.exports = Warper = class Warper {
  constructor() {
    this.mode = 'orto';
    this.progress = 1;
  }

  update(state) {
    var e, i, j, len, len1, ref, ref1, scene, transform;
    if (state.level.mode !== this.mode) {
      this.progress = 0;
      this.mode = state.level.mode;
    } else if (this.progress < 1) {
      this.progress += 0.03;
      transform = this.progress >= 1 ? makeZ.snap : makeZ.lerp;
      ref = state.level.scenes;
      for (i = 0, len = ref.length; i < len; i++) {
        scene = ref[i];
        ref1 = scene.children;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          e = ref1[j];
          transform(state, e.position);
        }
      }
    }
  }

};


},{"../utils/make-z":13}],10:[function(require,module,exports){
var CameraController, DEBUG, Particle, animate, currentState, init, level, renderer, resources, startLevel, states;

CameraController = require('./entities/camera-controller');

resources = require('./resources');

level = require('./level');

DEBUG = true;

currentState = function() {
  return states.find(function(state) {
    return !state.despawning;
  });
};

if (DEBUG) {
  window.addEventListener('keydown', function(e) {
    switch (e.key.toLowerCase()) {
      case 'r':
        return currentState().restart();
      case 'n':
        return currentState().next();
    }
  });
}

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

Particle = class Particle {
  constructor(pos, vel) {
    this.pos = pos;
    this.vel = vel;
  }

};

init = function(level, num) {
  var camera, cameraController, despawn, entity, j, len, onResize, particles, ref, state;
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 2048);
  camera.position.set(-1000, -1000, 16);
  camera.up.set(0, 1, 1).normalize();
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
      height = size * ratio(w);
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
  particles = [];
  despawn = function(offset) {
    var biasX, biasY, e, entity, height, j, k, l, len, len1, len2, oldCamera, ref, ref1, ref2, results, scene, vec, width;
    if (state.despawning) {
      return;
    }
    state.despawning = true;
    resources.sfx.sfx.play('explosion');
    level.player.state = 'goal';
    setTimeout((function() {
      return startLevel(num + (offset || 0));
    }), 1000);
    setTimeout((function() {
      return state.done = true;
    }), 5000);
    window.removeEventListener('resize', onResize);
    oldCamera = state.camera;
    ({width, height} = state.level);
    ref = state.level.scenes;
    for (j = 0, len = ref.length; j < len; j++) {
      scene = ref[j];
      ref1 = scene.children;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        e = ref1[k];
        biasX = e.position.x / width - 0.5;
        biasY = e.position.y / height - 0.5;
        vec = new THREE.Vector3(Math.random() + biasX, Math.random() + biasY, -Math.random());
        particles.push(new Particle(e.position, vec));
      }
    }
    ref2 = state.level.entities;
    results = [];
    for (l = 0, len2 = ref2.length; l < len2; l++) {
      entity = ref2[l];
      results.push(typeof entity.deinit === "function" ? entity.deinit(state) : void 0);
    }
    return results;
  };
  state = {
    done: false,
    despawning: false,
    level: level,
    levelNumber: num,
    player: level.player,
    camera: camera,
    resources: resources,
    sfx: resources.sfx.sfx,
    cameraController: cameraController,
    renderer: renderer,
    element: renderer.domElement,
    particles: particles,
    next: function() {
      return despawn(1);
    },
    restart: function() {
      return despawn(0);
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
  var ent, i, j, k, l, len, len1, len2, p, ref, ref1, ref2, results, scene, state;
  if ((ref = states[0]) != null ? ref.done : void 0) {
    state = states.shift();
  }
  requestAnimationFrame(animate);
  renderer.clear();
  results = [];
  for (j = 0, len = states.length; j < len; j++) {
    state = states[j];
    ref1 = state.level.scenes;
    for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
      scene = ref1[i];
      if (i) {
        renderer.clearDepth();
      }
      renderer.render(scene, state.camera);
    }
    ref2 = state.level.entities;
    for (l = 0, len2 = ref2.length; l < len2; l++) {
      ent = ref2[l];
      if (typeof ent.update === "function") {
        ent.update(state);
      }
    }
    results.push((function() {
      var len3, m, ref3, results1;
      ref3 = state.particles;
      results1 = [];
      for (m = 0, len3 = ref3.length; m < len3; m++) {
        p = ref3[m];
        p.vel.z -= 0.08;
        p.vel.multiplyScalar(0.94);
        results1.push(p.pos.add(p.vel));
      }
      return results1;
    })());
  }
  return results;
};

requestAnimationFrame(animate);


},{"./entities/camera-controller":4,"./level":11,"./resources":12}],11:[function(require,module,exports){
var Bird, Box, Goal, Level, ModePad, MoveIndicator, TouchInput, Warper, createEntity, createScene, entityMap, resources;

MoveIndicator = require('./entities/move-indicator');

TouchInput = require('./entities/touch-input');

ModePad = require('./entities/mode-pad');

Warper = require('./entities/warper');

Bird = require('./entities/bird');

Goal = require('./entities/goal');

Box = require('./entities/box');

resources = require('./resources');

Level = class Level {
  constructor(str) {
    this.mode = 'orto';
    this.entities = [new Warper, new TouchInput, new MoveIndicator];
    this.player = null;
    this.tiles = str.split("\n").map(function(str) {
      return str.split("");
    }).map((row, j) => {
      return row.map((char, i) => {
        var e;
        e = createEntity(char, i, j);
        if (e) {
          this.entities.push(e);
          if (e.type === 'player') {
            this.player = e;
          }
          e.x = i;
          return e.y = j;
        } else {
          return char;
        }
      });
    });
    this.width = this.tiles[0].length;
    this.height = this.tiles.length;
    this.scenes = createScene(this.tiles, this.entities);
  }

  canMove(entity, move) {
    var tile;
    tile = this.tileAt(entity.x + move.x, entity.y + move.y);
    return tile && tile !== '#' && tile !== ' ';
  }

  setTile(x, y, tile) {
    if (!this.tiles[y]) {
      this.tiles[y] = [];
    }
    return this.tiles[y][x] = tile;
  }

  tileAt(x, y) {
    var ref;
    return (ref = this.tiles[y]) != null ? ref[x] : void 0;
  }

  entityAt(x, y) {
    return this.entities.find(function(e) {
      return e.x === x && e.y === y;
    });
  }

  removeEntity(e) {
    var index;
    index = this.entities.indexOf(e);
    if (~index) {
      return this.entities.splice(index, 1);
    }
  }

};

module.exports = function(str) {
  return new Level(str);
};

entityMap = {
  '@': Bird,
  'H': ModePad,
  'O': ModePad,
  'D': ModePad,
  '!': Goal,
  'B': Box
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
      if (tile === ' ') {
        continue;
      }
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


},{"./entities/bird":2,"./entities/box":3,"./entities/goal":5,"./entities/mode-pad":6,"./entities/move-indicator":7,"./entities/touch-input":8,"./entities/warper":9,"./resources":12}],12:[function(require,module,exports){
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
    hex_pad: new THREE.CylinderGeometry(0.4, 0.4, 0.8, 6),
    orto_pad: new THREE.BoxGeometry(0.5, 0.5, 0.8),
    diag_pad: new THREE.ConeGeometry(0.5, 0.8, 3),
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
    diag_pad: new THREE.MeshBasicMaterial({
      color: 0xffff66,
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
    }),
    box: new THREE.MeshBasicMaterial({
      color: 0xdada33
    }),
    box_disabled: new THREE.MeshBasicMaterial({
      color: 0xaaaaaa
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


},{}],13:[function(require,module,exports){
var LERP_FACTOR, map;

LERP_FACTOR = 0.12;

map = {
  LERP_FACTOR: LERP_FACTOR,
  orto: function({z}) {
    return 0;
  },
  hex: function({x, y}) {
    return y - x;
  },
  diag: function({x, y}) {
    return (Math.abs(x + y) % 2) * 20;
  },
  snap: function(state, pos) {
    return pos.z = map[state.level.mode](pos);
  },
  lerp: function(state, pos) {
    var target;
    target = map[state.level.mode](pos);
    return pos.z = THREE.Math.lerp(pos.z, target, 0.24);
  }
};

module.exports = map;


},{}],14:[function(require,module,exports){
var east, ne, north, nw, se, south, sw, west;

north = new THREE.Vector3(0, -1, 0);

south = new THREE.Vector3(0, 1, 0);

west = new THREE.Vector3(-1, 0, 0);

east = new THREE.Vector3(1, 0, 0);

nw = new THREE.Vector3(-1, -1, 0);

ne = new THREE.Vector3(1, -1, 0);

sw = new THREE.Vector3(-1, 1, 0);

se = new THREE.Vector3(1, 1, 0);

module.exports = {
  orto: {
    w: north,
    d: east,
    s: south,
    a: west
  },
  hex: {
    w: north,
    e: ne,
    d: east,
    x: south,
    z: sw,
    a: west
  },
  diag: {
    w: nw,
    s: se,
    a: sw,
    d: ne
  }
};


},{}]},{},[10]);
