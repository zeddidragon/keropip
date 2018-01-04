(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var makeZ, moving, tmp;

makeZ = require('../utils/make-z');

tmp = new THREE.Vector3;

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
  tmp.set(this.x, -this.y, oldZ);
  makeZ.snap(state, tmp);
  return this.mesh.position.z = tmp.z;
};

moving.init = function() {
  this.from = new THREE.Vector3;
  this.to = new THREE.Vector3;
  return this.progress = 0;
};

module.exports = moving;


},{"../utils/make-z":15}],2:[function(require,module,exports){
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
    this.heldMove = null;
    this.from = new THREE.Vector3;
    this.to = new THREE.Vector3;
    this.progress = 0;
    this.rollVector = new THREE.Vector3;
    this.keyboardInput = true;
    this.startMove = false;
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
    var i, len, level, move, pushed, ref;
    if (this.nextMove || this.heldMove) {
      this.startMove = true;
      level = state.level;
      move = validMoves[level.mode][this.nextMove || this.heldMove];
      this.nextMove = null;
      if (!(move && level.canMove(this, move))) {
        return;
      }
      ref = level.entitiesAt(this.x + move.x, this.y + move.y);
      for (i = 0, len = ref.length; i < len; i++) {
        pushed = ref[i];
        if ((pushed != null ? pushed.push : void 0) && !pushed.push(state, move)) {
          return;
        }
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
    if (this.startMove) {
      this.startMove = false;
    }
    this.progress += 0.14;
    oldZ = this.mesh.position.z;
    if (this.progress < 2) {
      this.mesh.rotateOnWorldAxis(this.rollVector, 0.24 * Math.cos(this.progress));
      this.mesh.position.lerpVectors(this.from, this.to, 1.1 * Math.sin(this.progress));
    } else {
      this.mesh.position.copy(this.to);
      this.state = 'idle';
      if (this.heldMove) {
        this.nextMove = this.heldMove;
      }
    }
    return this.mesh.position.z = oldZ;
  }

};


},{"../resources":14,"../utils/make-z":15,"../utils/valid-moves":17}],3:[function(require,module,exports){
var Box, moving, resources, tmp, validMoves;

resources = require('../resources');

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
      var colliding, i, len, level, ref, tile;
      ({level} = state);
      if (this.nextState || this.state === 'passive') {
        return true;
      }
      tile = level.tileAt(this.x + move.x, this.y + move.y);
      if (tile === '#') {
        return;
      }
      ref = level.entitiesAt(this.x + move.x, this.y + move.y);
      for (i = 0, len = ref.length; i < len; i++) {
        colliding = ref[i];
        if (colliding.type === 'box') {
          return;
        }
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

  Box.prototype.type = 'box';

  Box.prototype.initMoving = moving.init;

  Box.prototype.moving = moving;

  return Box;

})();


},{"../components/moving":1,"../resources":14,"../utils/valid-moves":17}],4:[function(require,module,exports){
var CameraController, LERP_FACTOR, offsets, tmpVec, ups;

({LERP_FACTOR} = require('../utils/make-z'));

tmpVec = new THREE.Vector3;

offsets = {
  orto: new THREE.Vector3(0, 0, 24),
  hex: new THREE.Vector3(16, -16, 16),
  diag: new THREE.Vector3(12, -12, 16),
  jump: new THREE.Vector3(0, 0, 18)
};

ups = {
  orto: new THREE.Vector3(0, 1, 0),
  hex: new THREE.Vector3(0, 1, 0),
  diag: new THREE.Vector3(0, 0, 1),
  jump: new THREE.Vector3(-8, 12, 0)
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


},{"../utils/make-z":15}],5:[function(require,module,exports){
var GamepadInput, diff, tmp, tmpA, tmpB, transforms, validMoves;

validMoves = require('../utils/valid-moves');

transforms = require('../utils/transforms');

tmp = new THREE.Vector3;

tmpA = new THREE.Vector3;

tmpB = new THREE.Vector3;

diff = function(a, b) {
  return a.sub(b).lengthSq();
};

module.exports = GamepadInput = class GamepadInput {
  update(state) {
    var i, len, mode, moves, pad, pads, player, results, transform;
    ({
      player,
      level: {mode}
    } = state);
    if (player.state !== 'idle') {
      return;
    }
    pads = typeof navigator.getGamepads === "function" ? navigator.getGamepads() : void 0;
    moves = validMoves[mode];
    transform = transforms[mode];
    results = [];
    for (i = 0, len = pads.length; i < len; i++) {
      pad = pads[i];
      if (!pad) {
        continue;
      }
      tmp.set(pad.axes[0], pad.axes[1], 0);
      if (!(tmp.manhattanLength() >= 0.8)) {
        continue;
      }
      tmp.normalize();
      player.keyboardInput = false;
      results.push(player.nextMove = Object.keys(moves).sort(function(a, b) {
        a = tmpA.copy(moves[a]);
        b = tmpB.copy(moves[b]);
        if (transform) {
          transform(state, a);
          transform(state, b);
          a.normalize();
          b.normalize();
        }
        return diff(a, tmp) - diff(b, tmp);
      }).shift());
    }
    return results;
  }

};


},{"../utils/transforms":16,"../utils/valid-moves":17}],6:[function(require,module,exports){
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
    return setTimeout(state.next, 200);
  }

};


},{"../resources":14}],7:[function(require,module,exports){
var KeyboardInput;

module.exports = KeyboardInput = class KeyboardInput {
  constructor() {
    this.held = [];
  }

  init(state) {
    var player;
    player = state.level.player;
    this.onKeyDown = (event) => {
      var key;
      key = event.key.toLowerCase();
      if (!'qweasdzxcy'.includes(key)) {
        return;
      }
      key = key === 'y' ? 'z' : key;
      if (!this.held.includes(key)) {
        this.held.push(key);
        player.nextMove = key;
      }
      player.heldMove = key;
      player.keyboardInput = true;
    };
    this.onKeyUp = (event) => {
      var index, key;
      key = event.key.toLowerCase();
      index = this.held.indexOf(key);
      if (~index) {
        this.held.splice(index, 1);
      }
      player.heldMove = this.held[this.held.length - 1];
    };
    document.addEventListener('keydown', this.onKeyDown);
    return document.addEventListener('keyup', this.onKeyUp);
  }

  deinit() {
    document.removeEventListener('keydown', this.onKeyDown);
    return document.removeEventListener('keyup', this.onKeyUp);
  }

};


},{}],8:[function(require,module,exports){
var ModePad, charModes, resources;

resources = require('../resources');

charModes = {
  H: 'hex',
  O: 'orto',
  D: 'diag',
  J: 'jump'
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


},{"../resources":14}],9:[function(require,module,exports){
var MoveIndicator, makeZ, resources, validMoves;

resources = require('../resources');

validMoves = require('../utils/valid-moves');

makeZ = require('../utils/make-z');

module.exports = MoveIndicator = class MoveIndicator {
  constructor() {
    var block, i, j, letter;
    this.geometry = resources.geometry.block;
    this.material = resources.material.highlight_block;
    this.letterMaterial = resources.material.letters;
    this.blocks = [];
    this.letters = [];
    for (i = j = 1; j <= 8; i = ++j) {
      block = new THREE.Mesh(this.geometry, this.material);
      this.blocks.push(block);
      letter = new THREE.Mesh(resources.geometry.w, this.letterMaterial);
      this.letters.push(letter);
    }
  }

  init(state) {
    var block, i, j, len, ref, results;
    ref = this.blocks;
    results = [];
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      block = ref[i];
      state.level.scenes[2].add(block);
      results.push(state.level.scenes[2].add(this.letters[i]));
    }
    return results;
  }

  update(state) {
    var block, geometry, i, j, key, keys, len, letter, level, mode, move, moves, player, ref;
    ({level, player} = state);
    mode = level.mode;
    moves = validMoves[mode];
    keys = player.state === 'goal' ? [] : Object.keys(validMoves[mode]);
    ref = this.blocks;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      block = ref[i];
      key = keys[i];
      move = moves[key];
      letter = this.letters[i];
      if (key && move && level.canMove(player, move)) {
        block.position.set(player.x + move.x, -(player.y + move.y), 0);
        block.position.z = makeZ[level.mode](state, block.position);
        if (!block.visible) {
          block.visible = true;
        }
        if (player.keyboardInput) {
          geometry = resources.geometry[key];
          letter.position.copy(block.position);
          if (!letter.visible) {
            letter.visible = true;
          }
          if (block.geometry !== geometry) {
            letter.geometry = geometry;
          }
          letter.up.copy(state.camera.up);
          letter.lookAt(state.camera.position);
        } else if (letter.visible) {
          letter.visible = false;
        }
      } else {
        if (block.visible) {
          block.visible = false;
        }
        if (letter.visible) {
          letter.visible = false;
        }
      }
    }
  }

};


},{"../resources":14,"../utils/make-z":15,"../utils/valid-moves":17}],10:[function(require,module,exports){
var TouchInput, diff, tmp, tmpA, tmpB, transforms, validMoves;

validMoves = require('../utils/valid-moves');

transforms = require('../utils/transforms');

tmp = new THREE.Vector3;

tmpA = new THREE.Vector3;

tmpB = new THREE.Vector3;

diff = function(a, b) {
  return a.sub(b).lengthSq();
};

module.exports = TouchInput = class TouchInput {
  constructor() {
    this.touch = false;
    this.x = 0;
    this.y = 0;
    this.held = false;
  }

  init(state) {
    var element, level, player;
    ({level, element, player} = state);
    this.onTouch = (event) => {
      if (event.button || this.held) {
        return;
      }
      this.held = true;
      player.nextMove = this.adjustCourse(event);
      return player.keyboardInput = false;
    };
    this.adjustCourse = (event) => {
      var mode, moves, transform, x, y;
      if (!this.held) {
        return;
      }
      x = event.clientX;
      y = event.clientY;
      tmp.set(x - window.innerWidth * 0.5, y - window.innerHeight * 0.5, 0).normalize();
      ({mode} = level);
      moves = validMoves[mode];
      transform = transforms[mode];
      return player.heldMove = Object.keys(moves).sort(function(a, b) {
        a = tmpA.copy(moves[a]);
        b = tmpB.copy(moves[b]);
        if (transform) {
          transform(state, a);
          transform(state, b);
          a.normalize();
          b.normalize();
        }
        return diff(a, tmp) - diff(b, tmp);
      }).shift();
    };
    this.onRelease = (event) => {
      // Workaround for mousedown firing if you tap
      this.held = false;
      return player.heldMove = null;
    };
    element.addEventListener('pointerdown', this.onTouch);
    element.addEventListener('pointermove', this.adjustCourse);
    return element.addEventListener('pointerup', this.onRelease);
  }

  deinit({element}) {
    element.removeEventListener('pointerdown', this.onTouch);
    element.removeEventListener('pointermove', this.adjustCourse);
    return element.removeEventListener('pointerup', this.onRelease);
  }

};


},{"../utils/transforms":16,"../utils/valid-moves":17}],11:[function(require,module,exports){
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
    if (state.level.mode !== this.mode || state.player.startMove && this.mode === 'jump') {
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


},{"../utils/make-z":15}],12:[function(require,module,exports){
var CameraController, DEBUG, Particle, animate, bgmNode, currentState, init, initialPlay, level, muteNode, muted, ohNoStage, renderer, resources, restart, startLevel, states, toggleMute;

CameraController = require('./entities/camera-controller');

resources = require('./resources');

level = require('./level');

DEBUG = true;

currentState = function() {
  return states.find(function(state) {
    return !state.despawning;
  });
};

restart = function() {
  var ref;
  return (ref = currentState()) != null ? ref.restart() : void 0;
};

bgmNode = document.getElementById('bgm');

muteNode = document.getElementById('mute');

muted = false;

toggleMute = function() {
  if (initialPlay) {
    document.removeEventListener('click', initialPlay);
  }
  muted = !muted || muted === 'false';
  localStorage.muted = muted;
  if (muted) {
    bgmNode.pause();
    return muteNode.innerHTML = '&#x1f50a;';
  } else {
    bgmNode.play();
    return muteNode.innerHTML = '&#x1f507;';
  }
};

if (localStorage.muted === 'true') {
  toggleMute();
} else {
  initialPlay = function() {
    bgmNode.play();
    return document.removeEventListener('click', initialPlay);
  };
  document.addEventListener('click', initialPlay);
}

document.getElementById('restart').addEventListener('click', restart);

muteNode.addEventListener('click', toggleMute);

window.addEventListener('keydown', function(e) {
  switch (e.key.toLowerCase()) {
    case 'backspace':
      e.preventDefault();
      return restart();
    case 'n':
      if (DEBUG) {
        return currentState().next();
      }
      break;
    case 'm':
      return toggleMute();
  }
});

states = [];

ohNoStage = "Please refresh\n" + "Something went wrong but don't worry; your progress is saved.\n" + "#####\n" + "#...#\n" + "#.@.#\n" + "#...#\n" + "#####";

startLevel = function(n) {
  return fetch(`levels/${n}`).then(function(res) {
    if (res.status === 404) {
      n = 1;
      return fetch("levels/1");
    } else if (res.ok) {
      return res;
    } else {
      return ohNoStage;
    }
  }).then(function(res) {
    return (typeof res.text === "function" ? res.text() : void 0) || res;
  }).catch(function() {
    return ohNoStage;
  }).then(level).then(function(lv) {
    return states.push(init(lv, n));
  });
};

resources.loaded(function() {
  var key, num;
  if (location.search) {
    [key, num] = location.search.slice(1).split('&').map(function(str) {
      return str.split('=');
    }).find(function([key, val]) {
      return key === 'level';
    });
  }
  return startLevel(+num || localStorage.level || 1);
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
    var height, width;
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.fov = width > height ? camera.fov = 45 / camera.aspect : camera.fov = 35;
    camera.fov = Math.max(20, Math.min(360, camera.fov + Math.log(height)));
    return camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  onResize();
  if (!renderer.domElement.parentElement) {
    renderer.domElement.setAttribute('touch-action', 'none');
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
    ({width, height} = level);
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
      var maxLevel;
      maxLevel = +localStorage.level || 0;
      localStorage.level = Math.max(maxLevel, +num + 1);
      window.history.pushState({}, null, `?level=${+num + 1}`);
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


},{"./entities/camera-controller":4,"./level":13,"./resources":14}],13:[function(require,module,exports){
var Bird, Box, GamepadInput, Goal, KeyboardInput, Level, ModePad, MoveIndicator, TouchInput, Warper, createEntity, createScene, description, entityMap, makeDarkerGround, resources, title;

MoveIndicator = require('./entities/move-indicator');

KeyboardInput = require('./entities/keyboard-input');

GamepadInput = require('./entities/gamepad-input');

TouchInput = require('./entities/touch-input');

ModePad = require('./entities/mode-pad');

Warper = require('./entities/warper');

Bird = require('./entities/bird');

Goal = require('./entities/goal');

Box = require('./entities/box');

resources = require('./resources');

title = document.getElementById('title');

description = document.getElementById('description');

Level = class Level {
  constructor(str) {
    this.mode = 'orto';
    this.entities = [new Warper, new TouchInput, new GamepadInput, new KeyboardInput, new MoveIndicator];
    [title.textContent, description.textContent] = str.split("\n");
    this.player = null;
    this.tiles = str.split("\n").slice(2).map(function(str) {
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
          e.y = j;
          return '.';
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

  entitiesAt(x, y) {
    return this.entities.filter(function(e) {
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
  'J': ModePad,
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

makeDarkerGround = function() {
  var shaded;
  if (resources.material.block_shade) {
    return resources.material.block_shade;
  }
  shaded = resources.material.block.clone();
  shaded.color.multiplyScalar(0.8);
  return resources.material.block_shade = shaded;
};

createScene = function(tiles, entities) {
  var addMesh, block, darkerGround, e, entityScene, geometry, ground, i, j, k, l, len, len1, len2, m, material, overlayScene, row, solid, tile, tileScene;
  geometry = resources.geometry.block;
  ground = resources.material.block;
  darkerGround = makeDarkerGround(resources);
  solid = resources.material.block2;
  tileScene = new THREE.Scene;
  entityScene = new THREE.Scene;
  overlayScene = new THREE.Scene;
  for (j = k = 0, len = tiles.length; k < len; j = ++k) {
    row = tiles[j];
    for (i = l = 0, len1 = row.length; l < len1; i = ++l) {
      tile = row[i];
      if (tile === ' ') {
        continue;
      }
      material = tile === '#' ? solid : (i + j) % 2 ? ground : darkerGround;
      block = new THREE.Mesh(geometry, material);
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
  return [tileScene, entityScene, overlayScene];
};


},{"./entities/bird":2,"./entities/box":3,"./entities/gamepad-input":5,"./entities/goal":6,"./entities/keyboard-input":7,"./entities/mode-pad":8,"./entities/move-indicator":9,"./entities/touch-input":10,"./entities/warper":11,"./resources":14}],14:[function(require,module,exports){
var bgmNode, c, callback, i, isLoaded, j, k, l, len, len1, letters, load, loadCounter, loaded, loaders, quad, resources, row, size, tmpMat, x, x2, y, y2;

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
    jump_pad: new THREE.TorusKnotGeometry(0.3, 0.1, 16, 4),
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
    jump_pad: new THREE.MeshBasicMaterial({
      color: 0xff66ff,
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
      opacity: 0.3,
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

load = function(type, path, opts = {}) {
  ++loadCounter;
  return loaders[type].load("assets/" + path, function(obj) {
    var args, k, len, name, ref, transform;
    name = path.split('/').pop().split('.').shift();
    if (type === 'material') {
      if (opts.pixelated) {
        obj.minFilter = THREE.LinearMipMapFilter;
        obj.magFilter = THREE.NearestFilter;
      }
      args = Object.assign({}, opts.material, {
        map: obj
      });
      obj = new THREE.MeshBasicMaterial(args);
    }
    ref = opts.transforms || [];
    for (k = 0, len = ref.length; k < len; k++) {
      [transform, args] = ref[k];
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

load('geometry', 'bird/bird.json', {
  transforms: [['translate', [0, -5, 0]], ['scale', [0.24, 0.24, 0.24]]]
});

load('material', 'bird/bird_face.png');

load('material', 'bird/frog_eye.png');

load('material', 'bird/frog_face.png');

load('material', 'block.png');

load('material', 'block2.png');

load('material', 'letters.png', {
  pixelated: true,
  material: {
    transparent: true
  }
});

load('sfx', 'sfx.json');

letters = 'zxc\nasd\nqwe'.split('\n').map(function(row) {
  return row.split('');
});

for (j = k = 0, len = letters.length; k < len; j = ++k) {
  row = letters[j];
  y = 1 / 3 * j;
  y2 = y + 1 / 3;
  for (i = l = 0, len1 = row.length; l < len1; i = ++l) {
    c = row[i];
    x = 1 / 3 * i;
    x2 = x + 1 / 3;
    size = 0.2;
    quad = new THREE.Geometry;
    quad.vertices.push(new THREE.Vector3(-size, -size, 0));
    quad.vertices.push(new THREE.Vector3(size, -size, 0));
    quad.vertices.push(new THREE.Vector3(-size, size, 0));
    quad.vertices.push(new THREE.Vector3(size, size, 0));
    quad.faces.push(new THREE.Face3(0, 1, 2));
    quad.faces.push(new THREE.Face3(1, 3, 2));
    quad.faceVertexUvs[0].push([new THREE.Vector2(x, y), new THREE.Vector2(x2, y), new THREE.Vector2(x, y2)]);
    quad.faceVertexUvs[0].push([new THREE.Vector2(x2, y), new THREE.Vector2(x2, y2), new THREE.Vector2(x, y2)]);
    resources.geometry[c] = quad;
  }
}

module.exports = resources;


},{}],15:[function(require,module,exports){
var LERP_FACTOR, map, specialCases;

LERP_FACTOR = 0.12;

map = {
  LERP_FACTOR: LERP_FACTOR,
  orto: function() {
    return 0;
  },
  hex: function(state, {x, y}) {
    return y - x;
  },
  diag: function(state, {x, y}) {
    return (Math.abs(x + y) % 2) * 20;
  },
  jump: function({player}, {x, y}) {
    var col, ref, row, special, z;
    // https://stackoverflow.com/a/35968663
    x = Math.abs(x - player.x);
    y = Math.abs(y + player.y);
    if (y < x) {
      [x, y] = [y, x];
    }
    special = (ref = specialCases[x]) != null ? ref[y] : void 0;
    // Special case
    // Vertical case
    // Secondary diagonal
    // Primary diagonal
    z = special != null ? special : y >= x * 2 ? (col = Math.abs(1 - x), row = y - 2 * col - 2, row % 4 + col + 1 + 2 * Math.floor(row / 4)) : (x - y) % 2 ? 1 + 2 * Math.floor(((x + y) / 2 + 1) / 3) : 2 * Math.floor(((x + y) / 2 + 2) / 3);
    return -2 * z;
  },
  snap: function(state, pos) {
    return pos.z = map[state.level.mode](state, pos);
  },
  lerp: function(state, pos) {
    var target;
    target = map[state.level.mode](state, pos);
    return pos.z = THREE.Math.lerp(pos.z, target, 0.24);
  }
};

module.exports = map;

specialCases = {
  0: {
    0: 0,
    1: 3,
    2: 2,
    3: 3
  },
  1: {
    1: 2
  },
  2: {
    2: 4
  },
  3: {
    3: 2
  }
};


},{}],16:[function(require,module,exports){
module.exports = {
  hex: function(state, vec) {
    vec.x += vec.y * 0.5;
    return vec;
  },
  diag: function(state, vec) {
    if (vec.x === vec.y) {
      vec.x = 0;
    } else {
      vec.y = 0;
    }
    return vec;
  },
  jump: function(state, vec) {
    return vec.applyMatrix4(state.camera.matrix);
  }
};


},{}],17:[function(require,module,exports){
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
  },
  jump: {
    w: new THREE.Vector3(-1, -2, 0),
    e: new THREE.Vector3(1, -2, 0),
    d: new THREE.Vector3(2, -1, 0),
    c: new THREE.Vector3(2, 1, 0),
    x: new THREE.Vector3(1, 2, 0),
    z: new THREE.Vector3(-1, 2, 0),
    a: new THREE.Vector3(-2, 1, 0),
    q: new THREE.Vector3(-2, -1, 0)
  }
};


},{}]},{},[12]);
