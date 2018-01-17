(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Avatar, makeAvatar, makePad, makeZ, recipes, resources;

makeZ = require('./utils/make-z');

resources = require('./resources');

Avatar = class Avatar {
  constructor(mesh1) {
    this.mesh = mesh1;
    this.from = new THREE.Vector3;
    this.to = new THREE.Vector3;
    this.from.copy(this.mesh.position);
    this.rollVector = new THREE.Vector3(1, 0, 0);
    this.idleRoll = 0;
    this.activeRoll = 0;
  }

  move({timer}) {
    var oldZ;
    oldZ = this.mesh.position.z;
    this.mesh.position.lerpVectors(this.from, this.to, 1.1 * Math.sin(timer));
    if (!this.activeRoll) {
      return;
    }
    return this.mesh.rotateOnWorldAxis(this.rollVector, this.activeRoll * Math.cos(timer));
  }

  stop() {
    return this.mesh.position.copy(this.to);
  }

  start(state, {fromX, fromY, toX, toY}) {
    this.rollVector.set(toY - fromY, toX - fromX, 0).normalize();
    this.from.set(fromX, -fromY, 0);
    makeZ.snap(state, this.from);
    this.to.set(toX, -toY, 0);
    return makeZ.snap(state, this.to);
  }

  update() {
    if (!this.idleRoll) {
      return;
    }
    return this.mesh.rotateOnWorldAxis(this.rollVector, this.idleRoll);
  }

};

makeAvatar = function(geo, mat) {
  var geometry, material, mesh;
  geometry = resources.geometry[geo];
  material = resources.material[mat || geo];
  mesh = new THREE.Mesh(geometry, material);
  return new Avatar(mesh);
};

makePad = function(type) {
  var avatar;
  avatar = makeAvatar(`${type}_pad`);
  avatar.rollVector.set(1, 1, 0).normalize();
  avatar.idleRoll = 0.05;
  return avatar;
};

recipes = {
  '@': function() {
    var avatar, geometry, material, mesh;
    geometry = resources.geometry.bird;
    material = [resources.material.bird_arms, resources.material.bird_face, resources.material.frog_rim, resources.material.frog_face, resources.material.bird_beak, resources.material.frog_eye];
    mesh = new THREE.Mesh(geometry, material);
    avatar = new Avatar(mesh);
    avatar.activeRoll = 0.24;
    return avatar;
  },
  '!': function() {
    return makeAvatar('goal');
  },
  'B': function() {
    return makeAvatar('block', 'box');
  },
  'H': function() {
    return makePad('hex');
  },
  'O': function() {
    return makePad('orto');
  },
  'D': function() {
    return makePad('diag');
  },
  'J': function() {
    return makePad('jump');
  },
  'S': function() {
    return makePad('skip');
  }
};

module.exports = function(type) {
  return typeof recipes[type] === "function" ? recipes[type]() : void 0;
};


},{"./resources":24,"./utils/make-z":29}],2:[function(require,module,exports){
var bgmNode, initialPlay, setMute, toggleMute;

bgmNode = document.getElementById('bgm');

toggleMute = function() {
  if (localStorage['settings.mute'] === 'true') {
    setMute('false');
  } else {
    setMute('true');
  }
};

setMute = function(value) {
  var muted;
  if (initialPlay) {
    document.removeEventListener('click', initialPlay);
  }
  muted = value === 'true';
  localStorage['settings.mute'] = muted;
  if (muted) {
    bgmNode.pause();
  } else {
    bgmNode.play();
  }
};

if (localStorage['settings.mute'] === 'true') {
  setMute('true');
} else {
  initialPlay = function() {
    bgmNode.play();
    return document.removeEventListener('click', initialPlay);
  };
}

document.addEventListener('click', initialPlay);

toggleMute.setMute = setMute;

module.exports = toggleMute;


},{}],3:[function(require,module,exports){
var CameraController, LERP_FACTOR, offsets, tmpVec, ups;

({LERP_FACTOR} = require('../utils/make-z'));

tmpVec = new THREE.Vector3;

offsets = {
  orto: new THREE.Vector3(0, 0, 24),
  hex: new THREE.Vector3(16, -16, 16),
  diag: new THREE.Vector3(0, 0, 26),
  jump: new THREE.Vector3(0, 0, 28),
  skip: new THREE.Vector3(0, 0, 30),
  zoom: new THREE.Vector3(0, 0, 50)
};

ups = {
  orto: new THREE.Vector3(0, 1, 0),
  hex: new THREE.Vector3(0, 1, 0),
  diag: new THREE.Vector3(-1, 1, 0),
  jump: new THREE.Vector3(0, 1, 0),
  skip: new THREE.Vector3(0, 1, 0),
  zoom: new THREE.Vector3(0, 1, 0)
};

module.exports = CameraController = class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.state = 'tracking';
    this.offset = new THREE.Vector3().copy(offsets.orto);
    this.offsetOverride = null;
    this.from = new THREE.Vector3;
    this.to = new THREE.Vector3;
    this.progress = 0;
    this.zoom = 1;
  }

  warp(state, mode) {
    this.state = 'warping';
    this.from.copy(this.offset);
    this.progress = 0;
    this.to.copy(offsets[mode]);
    return this.camera.up.copy(ups[mode]);
  }

  tracking(state) {
    var position;
    if (state.phase === 'goal') {
      return;
    }
    ({position} = state.level.player.avatar.mesh);
    tmpVec.copy(this.offsetOverride || this.offset).multiplyScalar(this.zoom).add(position);
    this.camera.position.lerp(tmpVec, LERP_FACTOR);
    return this.camera.lookAt(position);
  }

  warping(state) {
    this.progress += 0.01;
    if (this.progress < 1) {
      this.offset.lerp(this.to, LERP_FACTOR);
    } else {
      this.offset.copy(this.to);
      this.state = 'tracking';
    }
    return this.tracking(state);
  }

  update(state) {
    var name;
    return typeof this[name = this.state] === "function" ? this[name](state) : void 0;
  }

};


},{"../utils/make-z":29}],4:[function(require,module,exports){
var GamepadInput, actions, bindings, diff, tmp, tmpA, tmpB, transforms, validMoves;

({actions} = require('../utils/actions'));

validMoves = require('../utils/valid-moves');

transforms = require('../utils/transforms');

tmp = new THREE.Vector3;

tmpA = new THREE.Vector3;

tmpB = new THREE.Vector3;

diff = function(a, b) {
  return a.sub(b).lengthSq();
};

bindings = {
  undo: 1,
  invalidate: 2,
  zoom: 4,
  peek: 5
};

module.exports = GamepadInput = class GamepadInput {
  constructor() {
    var action, i, j, k, len;
    this.pressed = [];
    for (i = j = 0; j <= 3; i = ++j) {
      this.pressed[i] = {};
      for (k = 0, len = actions.length; k < len; k++) {
        action = actions[k];
        this.pressed[i][action] = false;
      }
    }
    return;
  }

  update(state, parent) {
    var action, buttonState, i, j, k, len, len1, mode, moves, pad, pads, pressed, transform;
    ({mode} = state.level);
    pads = typeof navigator.getGamepads === "function" ? navigator.getGamepads() : void 0;
    moves = validMoves[mode];
    transform = transforms[mode];
    for (i = j = 0, len = pads.length; j < len; i = ++j) {
      pad = pads[i];
      if (!pad) {
        continue;
      }
      pressed = this.pressed[i];
      if (pad.buttons[9].pressed) {
        return state.restart();
      }
      for (k = 0, len1 = actions.length; k < len1; k++) {
        action = actions[k];
        buttonState = pad.buttons[bindings[action]].pressed;
        if (buttonState && !pressed[action]) {
          pressed[action] = true;
          parent[action] = true;
          return;
        } else if (!buttonState && pressed[action]) {
          pressed[action] = false;
          parent[action] = false;
          return;
        }
      }
      if (state.phase !== 'idle') {
        continue;
      }
      if (pad.buttons[0].pressed && parent.consideredMove) {
        parent.nextMove = parent.consideredMove;
        parent.consideredMove = null;
        return;
      }
      tmp.set(pad.axes[0], pad.axes[1], 0);
      if (!(tmp.manhattanLength() >= 0.8)) {
        continue;
      }
      tmp.normalize();
      parent.keyboardInput = false;
      parent.consideredMove = Object.keys(moves).sort(function(a, b) {
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
    }
  }

};


},{"../utils/actions":27,"../utils/transforms":30,"../utils/valid-moves":31}],5:[function(require,module,exports){
var KeyboardInput, actions, remap, schemes, special, valid;

({special, actions} = require('../utils/actions'));

schemes = {
  qwerty: {
    valid: 'qweasdzxcy',
    remap: {
      y: 'z'
    }
  },
  dvorak: {
    valid: "',.aoe;qj",
    remap: {
      "'": 'q',
      ",": 'w',
      ".": 'e',
      "o": 's',
      "e": 'd',
      ";": 'z',
      "q": 'x',
      "j": 'c'
    }
  }
};

({valid, remap} = schemes.qwerty);

KeyboardInput = class KeyboardInput {
  constructor() {
    var action, i, len;
    for (i = 0, len = actions.length; i < len; i++) {
      action = actions[i];
      this[`${action}Pressed`] = false;
      this[`${action}Released`] = false;
    }
    this.held = [];
  }

  init(state, parent) {
    this.parent = parent;
    this.onKeyDown = (event) => {
      var action, key;
      key = event.key.toLowerCase();
      action = special[key];
      if (action) {
        event.preventDefault();
        this[`${action}Pressed`] = true;
        return;
      }
      if (!valid.includes(key)) {
        return;
      }
      key = remap[key] || key;
      if (!this.held.includes(key)) {
        this.held.push(key);
        parent.nextMove = key;
      }
      parent.heldMove = key;
      parent.keyboardInput = true;
    };
    this.onKeyUp = (event) => {
      var action, index, key;
      key = event.key.toLowerCase();
      action = special[key];
      if (action) {
        event.preventDefault();
        this[`${action}Released`] = true;
        return;
      }
      key = remap[key] || key;
      index = this.held.indexOf(key);
      if (~index) {
        this.held.splice(index, 1);
      }
      parent.heldMove = this.held[this.held.length - 1];
    };
    document.addEventListener('keydown', this.onKeyDown);
    return document.addEventListener('keyup', this.onKeyUp);
  }

  deinit() {
    document.removeEventListener('keydown', this.onKeyDown);
    return document.removeEventListener('keyup', this.onKeyUp);
  }

  static setControls(value) {
    ({valid, remap} = schemes[value]);
    return localStorage['settings.controls'] = value;
  }

  update(value) {
    var action, i, key, len;
    for (i = 0, len = actions.length; i < len; i++) {
      action = actions[i];
      key = `${action}Pressed`;
      if (this[key]) {
        this.parent[action] = true;
        this[key] = false;
      }
      key = `${action}Released`;
      if (this[key]) {
        this.parent[action] = false;
        this[key] = false;
      }
    }
  }

};

KeyboardInput.setControls(localStorage['settings.controls'] || 'qwerty');

module.exports = KeyboardInput;


},{"../utils/actions":27}],6:[function(require,module,exports){
var MoveIndicator, makeZ, resources, validMoves;

resources = require('../resources');

validMoves = require('../utils/valid-moves');

makeZ = require('../utils/make-z');

module.exports = MoveIndicator = class MoveIndicator {
  constructor() {
    var block, i, j, letter;
    this.geometry = resources.geometry.block;
    this.material = resources.material.highlight_block;
    this.material_bad = resources.material.highlight_block_bad;
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
    var block, geometry, i, input, j, key, keys, len, letter, level, material, mode, move, moves, player, ref;
    ({level, player, input} = state);
    mode = level.mode;
    moves = validMoves[mode];
    keys = Object.keys(validMoves[mode]);
    ref = this.blocks;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      block = ref[i];
      key = keys[i];
      move = moves[key];
      letter = this.letters[i];
      if (key && move && ['idle', 'move'].includes(state.phase)) {
        block.position.set(player.x + move.x, -(player.y + move.y), 0);
        block.position.z = makeZ[level.mode](state, block.position);
        if (!block.visible) {
          block.visible = true;
        }
        material = level.canMove(player, move) ? this.material : this.material_bad;
        if (block.material !== material) {
          block.material = material;
        }
        if (input.keyboardInput || input.consideredMove === key) {
          if (input.consideredMove === key) {
            key = 'a';
          }
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


},{"../resources":24,"../utils/make-z":29,"../utils/valid-moves":31}],7:[function(require,module,exports){
var TouchInput, actions, diff, tmp, tmpA, tmpB, transforms, validMoves;

validMoves = require('../utils/valid-moves');

transforms = require('../utils/transforms');

({actions} = require('../utils/actions'));

tmp = new THREE.Vector3;

tmpA = new THREE.Vector3;

tmpB = new THREE.Vector3;

diff = function(a, b) {
  return a.sub(b).lengthSq();
};

document.getElementById('menu').addEventListener('click', function(e) {
  return e.stopPropagation();
});

module.exports = TouchInput = class TouchInput {
  constructor() {
    var action, i, len;
    this.x = 0;
    this.y = 0;
    this.held = false;
    for (i = 0, len = actions.length; i < len; i++) {
      action = actions[i];
      this[action] = false;
      this[`${action}Pressed`] = false;
      this[`${action}Released`] = false;
    }
    this.listeners = [];
    this.undoButton = null;
  }

  addAction(id, action) {
    var element, press, release;
    element = document.getElementById(id);
    if (!element) {
      return;
    }
    action || (action = id);
    press = (e) => {
      this[action] = true;
      return this[`${action}Pressed`] = true;
    };
    release = (e) => {
      if (!this[action]) {
        return;
      }
      this[action] = false;
      return this[`${action}Released`] = true;
    };
    this.listeners.push({
      element: element,
      events: ['pointerdown'],
      func: press
    });
    this.listeners.push({
      element: element,
      events: ['pointerup', 'pointerleave', 'pointercancel'],
      func: release
    });
    element.addEventListener('pointerdown', press);
    element.addEventListener('pointerup', release);
    element.addEventListener('pointerleave', release);
    return element.addEventListener('pointercancel', release);
  }

  init(state, parent) {
    var action, element, i, len, level;
    ({level, element} = state);
    this.parent = parent;
    this.onTouch = (event) => {
      if (event.button || this.held) {
        return;
      }
      this.held = true;
      parent.nextMove = this.adjustCourse(event);
      return parent.keyboardInput = false;
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
      return parent.heldMove = Object.keys(moves).sort(function(a, b) {
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
      return parent.heldMove = null;
    };
    element.addEventListener('pointerdown', this.onTouch);
    element.addEventListener('pointermove', this.adjustCourse);
    element.addEventListener('pointerup', this.onRelease);
    for (i = 0, len = actions.length; i < len; i++) {
      action = actions[i];
      this.addAction(action);
    }
  }

  deinit({element}) {
    var event, i, j, len, len1, listener, ref, ref1;
    ref = this.listeners;
    for (i = 0, len = ref.length; i < len; i++) {
      listener = ref[i];
      ref1 = listener.events;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        event = ref1[j];
        listener.element.removeEventListener(event, listener.func);
      }
    }
  }

  update(state) {
    var action, i, key, len;
    for (i = 0, len = actions.length; i < len; i++) {
      action = actions[i];
      key = `${action}Pressed`;
      if (this[key]) {
        this.parent[action] = true;
        this[key] = false;
      }
      key = `${action}Released`;
      if (this[key]) {
        this.parent[action] = false;
        this[key] = false;
      }
    }
  }

};


},{"../utils/actions":27,"../utils/transforms":30,"../utils/valid-moves":31}],8:[function(require,module,exports){
var Entity, avatar, noop, recipes;

avatar = require('./avatar');

Entity = class Entity {
  constructor(x1, y1) {
    this.x = x1;
    this.y = y1;
    this.avatar = null;
    this.type = null;
    this.warp = null;
    this.moving = false;
  }

  start(state, action) {
    var ref;
    ({
      toX: this.x,
      toY: this.y
    } = action);
    return (ref = this.avatar) != null ? ref.start(state, action) : void 0;
  }

  stop(state, action) {
    var ref;
    return (ref = this.avatar) != null ? ref.stop(state, action) : void 0;
  }

  move(state) {
    var ref;
    return (ref = this.avatar) != null ? ref.move(state) : void 0;
  }

  update(state) {
    var ref;
    return (ref = this.avatar) != null ? ref.update(state) : void 0;
  }

};

noop = function() {};

recipes = {
  '@': noop,
  'B': noop,
  '!': noop,
  H: function(entity) {
    return entity.warp = 'hex';
  },
  O: function(entity) {
    return entity.warp = 'orto';
  },
  D: function(entity) {
    return entity.warp = 'diag';
  },
  J: function(entity) {
    return entity.warp = 'jump';
  },
  S: function(entity) {
    return entity.warp = 'skip';
  }
};

module.exports = function(char, x, y) {
  var entity;
  if (!recipes[char]) {
    return;
  }
  entity = new Entity(x, y);
  entity.type = char;
  entity.avatar = avatar(char, entity);
  recipes[char](entity);
  return entity;
};


},{"./avatar":1}],9:[function(require,module,exports){
var classes, devScores, generateTable;

classes = ['level', 'score', 'undo'];

devScores = [12, 22, 31, 29, 54, 59, 14, 151, 75, 43, 16, 11, 22, 17, 77, 41, 55, 46, 22, 179, 78, 61, 41, 112, 129, 372];

generateTable = function() {
  var body, cell, i, j, k, len, node, par, row, rowNode, score;
  body = document.getElementById('hiscores-body');
  body.innerHTML = '';
  for (i = j = 1; j <= 26; i = ++j) {
    score = +localStorage[`hiscores.${i}`];
    par = devScores[i - 1] || 2e308;
    row = [i, score, localStorage[`hiscores.undos.${i}`], par];
    rowNode = document.createElement('tr');
    if ((score || 2e308) <= par) {
      rowNode.classList.add('par');
    }
    for (i = k = 0, len = row.length; k < len; i = ++k) {
      cell = row[i];
      node = document.createElement('td');
      if (cell) {
        node.textContent = cell;
      }
      node.classList.add(classes[i]);
      if (cell && !+cell) {
        node.classList.add('zero');
      }
      rowNode.appendChild(node);
    }
    body.appendChild(rowNode);
  }
};

document.getElementById('hiscore-check').addEventListener('change', function({target}) {
  if (target.checked) {
    return generateTable();
  }
});

document.getElementById('hiscores').addEventListener('click', function() {
  return document.getElementById('hiscore-check').checked = false;
});

module.exports = generateTable;


},{}],10:[function(require,module,exports){
var State, animate, currentLevel, fetchLevel, gameLoop, init, level, levelCache, ohNoStage, renderer, resources, startLevel, states, turnElement, turns, undos;

require('./menu');

require('./service-worker');

State = require('./state');

resources = require('./resources');

level = require('./level');

gameLoop = require('./loop');

currentLevel = require('./utils/current-level');

states = [];

ohNoStage = "Please refresh\n" + "Something went wrong but don't worry; your progress is saved.\n" + "#####\n" + "#...#\n" + "#.@.#\n" + "#...#\n" + "#####";

levelCache = {};

fetchLevel = function(n) {
  if (levelCache[n]) {
    return Promise.resolve(levelCache[n]);
  }
  return fetch(`levels/${n}`).then(function(res) {
    if (!res.ok) {
      throw new Error('failed to load level');
    }
    return res.text();
  }).then(function(level) {
    return levelCache[n] = level;
  }).catch(function() {
    delete levelCache[n];
    return ohNoStage;
  });
};

startLevel = function(n) {
  return fetchLevel(n).then(function(lv) {
    fetchLevel(+n + 1);
    lv = level(lv);
    return states.push(init(lv, n));
  });
};

resources.loaded(function() {
  startLevel(currentLevel({
    destructive: true
  }));
  return requestAnimationFrame(animate);
});

renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: document.getElementById('canvas')
});

renderer.autoClear = false;

init = function(level, num) {
  var state;
  state = new State(renderer, level, +num, startLevel);
  window.$state = state;
  return state.init();
};

turns = 0;

undos = 0;

turnElement = document.getElementById('turns');

animate = function() {
  var i, len, ref, state, str;
  if ((ref = states[0]) != null ? ref.done : void 0) {
    state = states.shift();
  }
  requestAnimationFrame(animate);
  renderer.clear();
  for (i = 0, len = states.length; i < len; i++) {
    state = states[i];
    gameLoop(state);
  }
  if (window.$state && (turns !== $state.turns.length || undos !== $state.undos)) {
    turns = $state.turns.length;
    undos = $state.undos;
    str = turns;
    if (undos) {
      str += ` (+${undos})`;
    }
    turnElement.textContent = str;
  }
};


},{"./level":12,"./loop":14,"./menu":23,"./resources":24,"./service-worker":25,"./state":26,"./utils/current-level":28}],11:[function(require,module,exports){
var GamepadInput, Input, KeyboardInput, TouchInput;

KeyboardInput = require('./entities/keyboard-input');

GamepadInput = require('./entities/gamepad-input');

TouchInput = require('./entities/touch-input');

module.exports = Input = class Input {
  constructor() {
    this.inputs = [new TouchInput, new GamepadInput, new KeyboardInput];
    this.nextMove = null;
    this.heldMove = null;
    this.consideredMove = null;
    this.keyboardInput = true;
    this.peek = false;
    this.zoom = false;
    this.undo = false;
    this.invalidate = false;
  }

  update(state) {
    var i, input, len, ref;
    ref = this.inputs;
    for (i = 0, len = ref.length; i < len; i++) {
      input = ref[i];
      if (typeof input.update === "function") {
        input.update(state, this);
      }
    }
  }

  init(state) {
    var i, input, len, ref;
    ref = this.inputs;
    for (i = 0, len = ref.length; i < len; i++) {
      input = ref[i];
      if (typeof input.init === "function") {
        input.init(state, this);
      }
    }
  }

  deinit(state) {
    var i, input, len, ref;
    ref = this.inputs;
    for (i = 0, len = ref.length; i < len; i++) {
      input = ref[i];
      if (typeof input.deinit === "function") {
        input.deinit(state);
      }
    }
  }

};


},{"./entities/gamepad-input":4,"./entities/keyboard-input":5,"./entities/touch-input":7}],12:[function(require,module,exports){
var Level, MoveIndicator, bevel, createEntity, createScene, description, makeGroundVariants, resources, title;

MoveIndicator = require('./entities/move-indicator');

createEntity = require('./entity');

resources = require('./resources');

title = document.getElementById('title');

description = document.getElementById('description');

Level = class Level {
  constructor(str) {
    this.mode = 'orto';
    this.effects = [new MoveIndicator];
    this.entities = [];
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
          if (e.type === '@') {
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
    this.scenes = createScene(this.tiles, this.entities);
  }

  init(state) {
    var effect, k, len, ref;
    ref = this.effects;
    for (k = 0, len = ref.length; k < len; k++) {
      effect = ref[k];
      if (typeof effect.init === "function") {
        effect.init(state);
      }
    }
  }

  canMove(entity, move) {
    var pushed, tile, x, y;
    x = entity.x + move.x;
    y = entity.y + move.y;
    tile = this.tileAt(entity.x + move.x, entity.y + move.y);
    if (!tile || tile === '#' || tile === ' ') {
      return false;
    }
    pushed = this.entityAt(x, y, 'B');
    return !pushed || this.canMoveBox(pushed, move);
  }

  canMoveBox(entity, move) {
    var x, y;
    x = entity.x + move.x;
    y = entity.y + move.y;
    if ('#' === this.tileAt(x, y)) {
      return false;
    }
    if (this.entityAt(x, y, 'B')) {
      return false;
    }
    return true;
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

  entityAt(x, y, type) {
    return this.entities.find(function(e) {
      return e.x === x && e.y === y && e.type === type;
    });
  }

  entitiesAt(x, y) {
    return this.entities.filter(function(e) {
      return e.x === x && e.y === y;
    });
  }

  addEntity(e) {
    return this.entities.push(e);
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

makeGroundVariants = function() {
  var shaded;
  if (resources.material.block_shade) {
    return resources.material.block_shade;
  }
  shaded = resources.material.block.clone();
  shaded.color.multiplyScalar(0.8);
  resources.material.block_shade = shaded;
  return shaded;
};

bevel = "11111 11110 11110 11100 10000".split(" ").map(function(row) {
  return row.split("").map(Number);
});

createScene = function(tiles, entities) {
  var addMesh, block, darkerGround, e, entityScene, faded, geometry, ground, height, i, iOffset, j, jOffset, k, l, len, m, material, overlayScene, ref, ref1, row, solid, tile, tileScene, width;
  geometry = resources.geometry.block;
  ground = resources.material.block;
  darkerGround = makeGroundVariants(resources);
  solid = resources.material.block2;
  faded = resources.material['block-fade'];
  tileScene = new THREE.Scene;
  entityScene = new THREE.Scene;
  overlayScene = new THREE.Scene;
  height = tiles.length;
  width = tiles.map(function(row) {
    return row.length;
  }).reduce(function(a, b) {
    return Math.max(a, b);
  });
  for (j = k = -5, ref = height + 4; -5 <= ref ? k <= ref : k >= ref; j = -5 <= ref ? ++k : --k) {
    row = tiles[j] || [];
    for (i = l = -5, ref1 = width + 4; -5 <= ref1 ? l <= ref1 : l >= ref1; i = -5 <= ref1 ? ++l : --l) {
      if ((i < 0 || i >= width) && (j < 0 || j >= height)) {
        iOffset = i < 0 ? -i - 1 : i - width;
        jOffset = j < 0 ? -j - 1 : j - height;
        if (!bevel[jOffset][iOffset]) {
          continue;
        }
      }
      tile = row != null ? row[i] : void 0;
      material = !tile || tile === ' ' ? faded : tile === '#' ? solid : (i + j) % 2 ? ground : darkerGround;
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
  for (m = 0, len = entities.length; m < len; m++) {
    e = entities[m];
    if (e.avatar) {
      addMesh(e, e.avatar.mesh);
    }
  }
  return [tileScene, entityScene, overlayScene];
};


},{"./entities/move-indicator":6,"./entity":8,"./resources":24}],13:[function(require,module,exports){
var actions, idle, makeMove, validMoves;

validMoves = require('../utils/valid-moves');

({actions} = require('../utils/actions'));

makeMove = function(moved, move) {
  return {
    name: moved.type === '@' ? 'move' : 'push',
    entity: moved,
    fromX: moved.x,
    fromY: moved.y,
    toX: moved.x + move.x,
    toY: moved.y + move.y
  };
};

idle = function(state) {
  var action, attempted, entities, entity, i, input, j, len, len1, level, move, moves, player, sfx, tile, x, y;
  ({input, level, player, sfx} = state);
  for (i = 0, len = actions.length; i < len; i++) {
    action = actions[i];
    if (!input[action]) {
      continue;
    }
    state.nextPhase = action;
    return state;
  }
  attempted = input.nextMove || input.heldMove;
  if (!attempted) {
    return state;
  }
  input.nextMove = null;
  move = validMoves[level.mode][attempted];
  if (!(move && level.canMove(player, move))) {
    return state;
  }
  moves = [makeMove(player, move)];
  entities = level.entitiesAt(player.x + move.x, player.y + move.y);
  for (j = 0, len1 = entities.length; j < len1; j++) {
    entity = entities[j];
    if (entity.warp && entity.warp !== level.mode) {
      moves.push({
        name: 'warp',
        from: state.level.mode,
        to: entity.warp
      });
    } else if (entity.type === 'B') {
      x = entity.x + move.x;
      y = entity.y + move.y;
      tile = level.tileAt(x, y);
      if (tile === '#' || level.entityAt(x, y, 'B')) {
        return state;
      }
      moves.push(makeMove(entity, move));
      if (tile === ' ' || !tile) {
        moves.push({
          name: 'settle',
          entity: entity
        });
      }
    } else if (entity.type === '!') {
      moves.push({
        name: 'goal'
      });
    }
  }
  sfx(`sweep${4 * Math.random() | 1}`);
  state.turns.push(moves);
  state.nextPhase = 'start';
  return state;
};

module.exports = idle;


},{"../utils/actions":27,"../utils/valid-moves":31}],14:[function(require,module,exports){
var gameLoop, genericPhase, idle, invalidate, loopable, move, peek, phases, start, stop, undo, warp, zoom;

idle = require('./idle');

start = require('./start');

move = require('./move');

stop = require('./stop');

warp = require('./warp');

undo = require('./undo');

zoom = require('./zoom');

peek = require('./peek');

invalidate = require('./super-undo');

genericPhase = function(state) {
  var entity, j, len, phase, ref;
  ({phase} = state);
  ref = state.level.entities;
  for (j = 0, len = ref.length; j < len; j++) {
    entity = ref[j];
    if (typeof entity[phase] === "function") {
      entity[phase](state);
    }
  }
};

phases = {
  idle: idle,
  start: start,
  move: move,
  stop: stop,
  warp: warp,
  undo: undo,
  zoom: zoom,
  peek: peek,
  invalidate: invalidate
};

loopable = ['move', 'start', 'stop'];

gameLoop = function(state) {
  var e, i, input, j, k, l, len, len1, len2, len3, m, name, p, ref, ref1, ref2, ref3, renderer, scene;
  ({input, renderer} = state);
  input.update(state);
  while (true) {
    if (state.nextPhase) {
      state.phase = state.nextPhase;
      state.nextPhase = null;
    }
    if (typeof phases[name = state.phase] === "function") {
      phases[name](state);
    }
    if (!loopable.includes(state.nextPhase)) {
      break;
    }
  }
  state.cameraController.update(state);
  ref = state.level.entities;
  for (j = 0, len = ref.length; j < len; j++) {
    e = ref[j];
    e.update(state);
  }
  ref1 = state.level.effects;
  for (k = 0, len1 = ref1.length; k < len1; k++) {
    e = ref1[k];
    e.update(state);
  }
  ref2 = state.level.scenes;
  for (i = l = 0, len2 = ref2.length; l < len2; i = ++l) {
    scene = ref2[i];
    renderer.clearDepth();
    renderer.render(scene, state.camera);
  }
  ref3 = state.particles;
  for (m = 0, len3 = ref3.length; m < len3; m++) {
    p = ref3[m];
    p.vel.multiplyScalar(0.94);
    p.vel.z -= 0.08;
    p.pos.add(p.vel);
  }
  return state;
};

module.exports = gameLoop;


},{"./idle":13,"./move":15,"./peek":16,"./start":17,"./stop":18,"./super-undo":19,"./undo":20,"./warp":21,"./zoom":22}],15:[function(require,module,exports){
var move, warp;

({warp} = require('./warp'));

move = function(state) {
  var entity, i, len, ref;
  state.timer += 0.12 * state.speed;
  if (state.timer <= 1.12 && state.level.mode === 'jump') {
    warp(state);
  }
  ref = state.level.entities;
  for (i = 0, len = ref.length; i < len; i++) {
    entity = ref[i];
    if (entity.moving) {
      if (typeof entity.move === "function") {
        entity.move(state);
      }
    }
  }
  if (state.timer > 2 / state.speed) {
    state.nextPhase = 'stop';
  }
  return state;
};

module.exports = move;


},{"./warp":21}],16:[function(require,module,exports){
var peek, warp;

({warp} = require('./warp'));

peek = function(state) {
  var cameraController, input, target;
  ({input, cameraController} = state);
  target = state.level.mode === 'hex' ? 'orto' : 'hex';
  if (cameraController.mode !== 'target') {
    state.timer = 0;
    cameraController.warp(state, target);
  }
  if (state.timer <= 1) {
    state.timer += 0.1;
    warp(state, target);
  }
  if (!input.peek) {
    cameraController.warp(state, state.level.mode);
    state.timer = 0;
    state.nextPhase = 'warp';
  }
  return state;
};

module.exports = peek;


},{"./warp":21}],17:[function(require,module,exports){
var actions, makeZ, start;

makeZ = require('../utils/make-z');

actions = {
  move: function(state, action) {
    action.entity.start(state, action);
    return action.entity.moving = true;
  },
  push: function(state, action) {
    actions.move(state, action);
    return state.sfx(`push${4 * Math.random() | 1}`);
  },
  warp: function(state, {to}) {
    return state.nextMode = to;
  }
};

start = function(state) {
  var action, i, len, name, ref, turn;
  ref = state.turns, turn = ref[ref.length - 1];
  for (i = 0, len = turn.length; i < len; i++) {
    action = turn[i];
    if (typeof actions[name = action.name] === "function") {
      actions[name](state, action);
    }
  }
  state.phase = 'move';
  state.timer = 0;
};

module.exports = start;


},{"../utils/make-z":29}],18:[function(require,module,exports){
var actions, generateHiscore, resources, stop;

resources = require('../resources');

generateHiscore = require('../hiscore-table');

actions = {
  settle: function(state, action) {
    var entity, level, mesh;
    ({level} = state);
    ({entity} = action);
    ({mesh} = entity.avatar);
    state.sfx('clang');
    mesh.material = resources.material.box_disabled;
    level.scenes[0].add(mesh);
    level.setTile(entity.x, entity.y, 'B');
    entity.stop(state);
    return level.removeEntity(entity);
  },
  goal: function(state) {
    var bestTurns, bestUndos, levelNumber, turns, undos;
    ({turns, undos, levelNumber} = state);
    bestTurns = localStorage[`hiscores.${levelNumber}`] || 2e308;
    bestUndos = localStorage[`hiscores.undos.${levelNumber}`] || 2e308;
    if (turns.length < bestTurns || turns.length === bestTurns && undos < bestUndos) {
      localStorage[`hiscores.${levelNumber}`] = turns.length;
      localStorage[`hiscores.undos.${levelNumber}`] = undos;
    }
    generateHiscore();
    return state.next();
  }
};

stop = function(state) {
  var action, entity, i, j, len, len1, name, ref, ref1, ref2, turn;
  ref = state.turns, turn = ref[ref.length - 1];
  ref1 = turn || [];
  for (i = 0, len = ref1.length; i < len; i++) {
    action = ref1[i];
    if (typeof actions[name = action.name] === "function") {
      actions[name](state, action);
    }
  }
  ref2 = state.level.entities;
  for (j = 0, len1 = ref2.length; j < len1; j++) {
    entity = ref2[j];
    if (!entity.moving) {
      continue;
    }
    if (typeof entity.stop === "function") {
      entity.stop(state);
    }
    entity.moving = false;
  }
  if (state.nextMode) {
    state.nextPhase = 'warp';
    state.cameraController.warp(state, state.nextMode);
    state.level.mode = state.nextMode;
    state.nextMode = null;
    state.timer = 0;
  } else if (!state.nextPhase) {
    state.nextPhase = 'idle';
  }
  return state;
};

module.exports = stop;


},{"../hiscore-table":9,"../resources":24}],19:[function(require,module,exports){
var superUndo, undo;

undo = require('./undo');

superUndo = function(state) {
  var turn;
  while (true) {
    turn = undo(state);
    if (!turn || turn.length > 1) {
      break;
    }
  }
  if (state.nextPhase !== 'idle') {
    state.sfx('rewind');
  }
};

module.exports = superUndo;


},{"./undo":20}],20:[function(require,module,exports){
var actions, makeZ, resources, undo;

resources = require('../resources');

makeZ = require('../utils/make-z');

actions = {
  move: function(state, action) {
    action.entity.start(state, {
      name: action.name,
      entity: action.entity,
      fromX: action.toX,
      fromY: action.toY,
      toX: action.fromX,
      toY: action.fromY
    });
    return action.entity.moving = true;
  },
  push: function(state, action) {
    return actions.move(state, action);
  },
  warp: function(state, {from}) {
    return state.nextMode = from;
  },
  settle: function(state, action) {
    var entity, level, mesh;
    ({level} = state);
    ({entity} = action);
    ({mesh} = entity.avatar);
    mesh.material = resources.material.box;
    level.scenes[1].add(mesh);
    level.setTile(entity.x, entity.y, ' ');
    return level.addEntity(entity);
  }
};

undo = function(state) {
  var action, i, name, turn;
  turn = state.turns.pop();
  if (!turn) {
    state.nextPhase || (state.nextPhase = 'idle');
    return;
  }
  state.undos += 1;
  for (i = turn.length - 1; i >= 0; i += -1) {
    action = turn[i];
    if (typeof actions[name = action.name] === "function") {
      actions[name](state, action);
    }
  }
  state.nextPhase = 'move';
  state.timer = 0;
  return turn;
};

module.exports = undo;


},{"../resources":24,"../utils/make-z":29}],21:[function(require,module,exports){
var makeZ, warp, warpPhase;

makeZ = require('../utils/make-z');

warp = function(state, override) {
  var e, i, len, ref, results, scene, transform;
  transform = state.timer >= 1 ? makeZ.snap : makeZ.lerp;
  ref = state.level.scenes;
  results = [];
  for (i = 0, len = ref.length; i < len; i++) {
    scene = ref[i];
    results.push((function() {
      var j, len1, ref1, results1;
      ref1 = scene.children;
      results1 = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        e = ref1[j];
        results1.push(transform(state, e.position, override));
      }
      return results1;
    })());
  }
  return results;
};

warpPhase = function(state) {
  if (!state.timer) {
    state.sfx('warp');
  }
  state.timer += 0.1;
  warp(state);
  if (state.timer >= 1) {
    state.nextPhase = 'idle';
  }
};

warpPhase.warp = warp;

module.exports = warpPhase;


},{"../utils/make-z":29}],22:[function(require,module,exports){
var zoom;

zoom = function(state) {
  var cameraController, input;
  ({input, cameraController} = state);
  if (cameraController.zoom < 2) {
    cameraController.zoom = 2;
  }
  if (!input.zoom) {
    cameraController.zoom = 1;
    state.nextPhase = 'idle';
  }
  return state;
};

module.exports = zoom;


},{}],23:[function(require,module,exports){
var closeMenu, currentLevel, functions, i, initialFullscreen, inputTypes, levels, makeCheckbox, makeItem, makeRadios, makeSelect, makeSlider, maxLevel, menuList, muteSfx, selectedValue, setControls, setFullscreen, setLabels, setLevel, setSpeed, toggleAttribute, toggleMute, updateLevelSelector;

toggleMute = require('./bgm');

currentLevel = require('./utils/current-level');

({setControls} = require('./entities/keyboard-input'));

require('./hiscore-table');

menuList = document.getElementById('menu-list');

document.getElementById('credits').addEventListener('click', function() {
  return document.getElementById('credits-check').checked = false;
});

toggleAttribute = function(element, attribute, value) {
  if (value) {
    element.setAttribute(attribute, value);
  } else {
    element.removeAttribute(attribute);
  }
};

selectedValue = function(namespace, opts = {}) {
  return '' + (opts.value || localStorage[opts.key || `settings.${namespace}`] || opts.default || '');
};

makeRadios = function(namespace, items, opts = {}) {
  var box, item, j, label, len, results, value;
  value = selectedValue(namespace, opts);
  results = [];
  for (j = 0, len = items.length; j < len; j++) {
    item = items[j];
    label = document.createElement('label');
    label.innerHTML = item.label;
    box = document.createElement('input');
    box.type = 'radio';
    box.name = namespace;
    box.value = item.value;
    if (value === item.value) {
      box.checked = true;
    }
    label.appendChild(box);
    box.addEventListener('change', function({target}) {
      return typeof functions[namespace] === "function" ? functions[namespace](target.value) : void 0;
    });
    results.push(label);
  }
  return results;
};

makeCheckbox = function(namespace, item) {
  var box, label, value;
  value = selectedValue(namespace, item);
  label = document.createElement('label');
  label.innerHTML = item.label;
  box = document.createElement('input');
  box.type = 'checkbox';
  box.name = namespace;
  box.checked = value === true || value === 'true';
  label.appendChild(box);
  box.addEventListener('change', function({target}) {
    var val;
    val = target.checked ? 'true' : 'false';
    return typeof functions[namespace] === "function" ? functions[namespace](val) : void 0;
  });
  return label;
};

makeSelect = function(namespace, items, opts = {}) {
  var container, item, j, len, option, value;
  container = document.createElement('select');
  value = selectedValue(namespace, opts);
  container.addEventListener('change', function({target}) {
    return typeof functions[namespace] === "function" ? functions[namespace](target.value) : void 0;
  });
  for (j = 0, len = items.length; j < len; j++) {
    item = items[j];
    option = document.createElement('option');
    option.innerHTML = item.label || item.value || item;
    option.value = item.value || item.label || item;
    toggleAttribute(option, 'selected', value === '' + option.value);
    toggleAttribute(option, 'disabled', item.disabled);
    option.dataset.namespace = namespace;
    container.appendChild(option);
  }
  return container;
};

makeSlider = function(namespace, item) {
  var label, slider, value;
  value = selectedValue(namespace, item);
  label = document.createElement('label');
  label.innerHTML = item.label;
  slider = document.createElement('input');
  slider.type = 'range';
  slider.name = namespace;
  slider.value = value || 0;
  label.appendChild(slider);
  slider.addEventListener('change', function({target}) {
    return typeof functions[namespace] === "function" ? functions[namespace](target.value) : void 0;
  });
  return label;
};

inputTypes = {
  radio: makeRadios,
  select: makeSelect,
  toggle: makeCheckbox,
  slider: makeSlider
};

makeItem = function(type, namespace, items, opts = {}) {
  var el, elements, j, len, listItem;
  elements = inputTypes[type](namespace, items, opts);
  listItem = document.createElement('li');
  if (!Array.isArray(elements)) {
    elements = [elements];
  }
  for (j = 0, len = elements.length; j < len; j++) {
    el = elements[j];
    listItem.appendChild(el);
  }
  menuList.appendChild(listItem);
};

makeItem('toggle', 'mute', {
  label: 'Mute BGM &#x1f39c;',
  default: 'false'
});

makeItem('toggle', 'mutesfx', {
  label: 'Mute SFX &#x1f507;',
  default: 'false'
});

makeItem('toggle', 'fullscreen', {
  label: 'Fullscreen &#x26f6;',
  default: 'false'
});

makeItem('toggle', 'labels', {
  label: 'Labels &#x1f3f7;',
  default: 'false'
});

makeItem('radio', 'controls', [
  {
    label: 'Qwerty',
    value: 'qwerty'
  },
  {
    label: 'Dvorak',
    value: 'dvorak'
  }
], {
  default: 'qwerty'
});

makeItem('slider', 'speed', {
  label: 'Speed',
  default: 0
});

maxLevel = Math.max(1, localStorage.level || 0);

levels = (function() {
  var j, results;
  results = [];
  for (i = j = 1; j <= 26; i = ++j) {
    results.push({
      label: `Level ${i}`,
      value: i,
      disabled: i > maxLevel
    });
  }
  return results;
})();

updateLevelSelector = function(num) {
  var el, j, len, ref;
  num = +num || 0;
  localStorage.level = Math.max(maxLevel, num);
  maxLevel = +localStorage.level || 0;
  ref = document.querySelectorAll('[data-namespace=level]');
  for (j = 0, len = ref.length; j < len; j++) {
    el = ref[j];
    toggleAttribute(el, 'selected', el.value === num + '');
    toggleAttribute(el, 'disabled', el.value > maxLevel);
  }
};

makeItem('select', 'level', levels, {
  key: 'level',
  value: currentLevel(),
  default: 1
});

setLevel = function(value) {
  closeMenu();
  return typeof $state !== "undefined" && $state !== null ? $state.despawn(+value) : void 0;
};

setFullscreen = function(value) {
  localStorage['settings.fullscreen'] = value;
  return typeof $state !== "undefined" && $state !== null ? $state.setFullscreen(value === 'true') : void 0;
};

document.getElementById('restart').addEventListener('click', function() {
  $state.restart();
  return closeMenu();
});

setLabels = function(value) {
  localStorage['settings.labels'] = value;
  if (value === 'true') {
    return document.body.classList.add('show-labels');
  } else {
    return document.body.classList.remove('show-labels');
  }
};

if (localStorage['settings.labels'] === 'true') {
  setLabels('true');
}

setSpeed = function(value) {
  localStorage['settings.speed'] = value;
  return typeof $state !== "undefined" && $state !== null ? $state.speed = 1 + +value / 100 : void 0;
};

muteSfx = function(value) {
  return localStorage['settings.mutesfx'] = value;
};

functions = {
  mute: toggleMute.setMute,
  mutesfx: muteSfx,
  level: setLevel,
  controls: setControls,
  fullscreen: setFullscreen,
  labels: setLabels,
  speed: setSpeed,
  updateLevelSelector: updateLevelSelector
};

if (localStorage['settings.fullscreen'] === 'true') {
  document.querySelector('[name=fullscreen]').checked = true;
  initialFullscreen = function() {
    setFullscreen('true');
    return document.removeEventListener('click', initialFullscreen);
  };
  document.addEventListener('click', initialFullscreen);
}

closeMenu = function() {
  var el, j, len, ref;
  ref = document.querySelectorAll('.dropdown-check');
  for (j = 0, len = ref.length; j < len; j++) {
    el = ref[j];
    if (el.checked) {
      el.checked = false;
    }
  }
};

window.addEventListener('keydown', function(e) {
  var muted;
  if (!$state) {
    return;
  }
  switch (e.key.toLowerCase()) {
    case 'backspace':
      e.preventDefault();
      closeMenu();
      return $state.restart();
    case 'n':
      if (!window.isDebug) {
        return;
      }
      closeMenu();
      return $state.next();
    case 'm':
      toggleMute();
      muted = localStorage['settings.mute'] === 'true';
      return document.querySelector("[name=mute]").checked = muted;
  }
});

module.exports = functions;


},{"./bgm":2,"./entities/keyboard-input":5,"./hiscore-table":9,"./utils/current-level":28}],24:[function(require,module,exports){
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
    hex_pad: new THREE.CylinderGeometry(0.4, 0.4, 0.1, 6),
    orto_pad: new THREE.BoxGeometry(0.5, 0.5, 0.5),
    diag_pad: new THREE.TetrahedronGeometry(0.5),
    jump_pad: (function() {
      var line, z;
      z = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      line = z.clone();
      tmpMat.makeTranslation(-0.2, 0.2, 0);
      z.applyMatrix(tmpMat);
      tmpMat.makeTranslation(0.2, -0.2, 0);
      line.applyMatrix(tmpMat);
      z.merge(line);
      line = new THREE.BoxGeometry(0.2, 0.6, 0.2);
      z.merge(line);
      return z;
    })(),
    skip_pad: (function() {
      var cross, vertical;
      cross = new THREE.BoxGeometry(0.2, 0.2, 0.8);
      vertical = new THREE.BoxGeometry(0.8, 0.2, 0.2);
      cross.merge(vertical);
      return cross;
    })(),
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
      wireframe: true
    }),
    orto_pad: new THREE.MeshBasicMaterial({
      color: 0xff6666,
      wireframe: true
    }),
    diag_pad: new THREE.MeshBasicMaterial({
      color: 0xffff66,
      wireframe: true
    }),
    jump_pad: new THREE.MeshBasicMaterial({
      color: 0xff66ff,
      wireframe: true
    }),
    skip_pad: new THREE.MeshBasicMaterial({
      color: 0x66ff66,
      wireframe: true
    }),
    goal: new THREE.MeshBasicMaterial({
      color: 0xf0e68c
    }),
    highlight_block: new THREE.MeshBasicMaterial({
      color: 0x3355ff,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    }),
    highlight_block_bad: new THREE.MeshBasicMaterial({
      color: 0xff5533,
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

load('material', 'block-fade.png', {
  material: {
    color: 0x484848
  }
});

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


},{}],25:[function(require,module,exports){
if (navigator.serviceWorker && !window.isDebug) {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage('check-ready');
  } else {
    navigator.serviceWorker.register('sw.js', {
      scope: './'
    });
  }
  navigator.serviceWorker.addEventListener('message', function(event) {
    var ref;
    return (ref = document.getElementById('sw-status')) != null ? ref.classList.add('ready') : void 0;
  });
}


},{}],26:[function(require,module,exports){
var CameraController, Input, MAX_LEVEL, Particle, State, level, resources, updateLevelSelector;

resources = require('./resources');

level = require('./level');

Input = require('./input');

CameraController = require('./entities/camera-controller');

({updateLevelSelector} = require('./menu'));

MAX_LEVEL = 26;

Particle = class Particle {
  constructor(pos, vel) {
    this.pos = pos;
    this.vel = vel;
  }

};

State = class State {
  constructor(renderer, level1, levelNumber, callback) {
    var sfx;
    this.renderer = renderer;
    this.level = level1;
    this.levelNumber = levelNumber;
    this.callback = callback;
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 2048);
    this.camera.position.set(-1000, -1000, 16);
    this.camera.up.set(0, 1, 1).normalize();
    this.cameraController = new CameraController(this.camera);
    this._onResize = this.onResize.bind(this);
    this.despawning = false;
    this.phase = 'idle';
    this.nextPhase = null;
    this.nextMode = null;
    this.timer = 0;
    this.done = false;
    this.player = this.level.player;
    this.element = this.renderer.domElement;
    this.particles = [];
    this.turns = [];
    this.input = new Input;
    this.undos = 0;
    this.speed = 1 + (+localStorage['settings.speed'] / 100 || 0);
    ({sfx} = resources.sfx);
    this.sfx = function(path) {
      if (localStorage['settings.mutesfx'] !== 'true') {
        sfx.play(path);
      }
    };
  }

  init() {
    var entity, i, len, ref;
    window.addEventListener('resize', this._onResize);
    this.onResize();
    ref = this.level.entities;
    for (i = 0, len = ref.length; i < len; i++) {
      entity = ref[i];
      if (typeof entity.init === "function") {
        entity.init(this);
      }
    }
    this.input.init(this);
    this.level.init(this);
    return this;
  }

  onResize() {
    var height, width;
    width = window.innerWidth;
    height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.fov = width > height ? this.camera.fov = 45 / this.camera.aspect + 2 * Math.log(height) : this.camera.fov = 30 + 3 * Math.log(height);
    this.camera.fov = Math.max(20, Math.min(120, this.camera.fov));
    return this.camera.updateProjectionMatrix();
  }

  enterFullscreen() {
    var element;
    element = document.body;
    return (typeof element.requestFullscreen === "function" ? element.requestFullscreen() : void 0) || (typeof element.mozRequestFullScreen === "function" ? element.mozRequestFullScreen() : void 0) || (typeof element.webkitRequestFullscreen === "function" ? element.webkitRequestFullscreen() : void 0) || (typeof element.msRequestFullscreen === "function" ? element.msRequestFullscreen() : void 0);
  }

  leaveFullscreen() {
    return (typeof document.exitFullscreen === "function" ? document.exitFullscreen() : void 0) || (typeof document.moxCancelFullScreen === "function" ? document.moxCancelFullScreen() : void 0) || (typeof document.webkitExitFullscreen === "function" ? document.webkitExitFullscreen() : void 0);
  }

  setFullscreen(value) {
    if (value) {
      return this.enterFullscreen();
    } else {
      return this.leaveFullscreen();
    }
  }

  despawn(level) {
    var biasX, biasY, e, entity, height, i, j, k, len, len1, len2, ref, ref1, ref2, scene, vec, width;
    if (this.despawning) {
      return;
    }
    this.nextPhase = 'goal';
    this.despawning = true;
    this.sfx('explosion');
    this.input.deinit(this);
    setTimeout((() => {
      return this.callback(+level);
    }), 1000);
    setTimeout((() => {
      return this.done = true;
    }), 5000);
    window.removeEventListener('resize', this._onResize);
    ({width, height} = this.level);
    ref = this.level.scenes;
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
    updateLevelSelector(level);
    ref2 = this.level.entities;
    for (k = 0, len2 = ref2.length; k < len2; k++) {
      entity = ref2[k];
      if (typeof entity.deinit === "function") {
        entity.deinit(this);
      }
    }
  }

  next() {
    var num;
    num = this.levelNumber;
    if (num >= MAX_LEVEL) {
      document.getElementById('credits-check').checked = true;
      return;
    }
    return this.despawn(this.levelNumber + 1);
  }

  restart() {
    return this.despawn(this.levelNumber);
  }

};

module.exports = State;


},{"./entities/camera-controller":3,"./input":11,"./level":12,"./menu":23,"./resources":24}],27:[function(require,module,exports){
var actions, special;

special = {
  u: 'undo',
  i: 'invalidate',
  tab: 'zoom',
  " ": 'peek'
};

actions = Object.keys(special).map(function(k) {
  return special[k];
});

module.exports = {special, actions};


},{}],28:[function(require,module,exports){
var currentLevel;

currentLevel = function(opts = {}) {
  var key, num;
  if (location.search) {
    [key, num] = location.search.slice(1).split('&').map(function(str) {
      return str.split('=');
    }).find(function([key, val]) {
      return key === 'level';
    });
    if (opts.destructive) {
      window.history.replaceState({}, null, location.pathname);
    }
  }
  return +num || localStorage.level || 1;
};

module.exports = currentLevel;


},{}],29:[function(require,module,exports){
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
    return -(Math.abs(x + y) % 2);
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
    return -0.3 * z;
  },
  skip: function({player}, {x, y}) {
    x = Math.abs(x - player.x);
    y = Math.abs(y + player.y);
    return -(x % 2 || y % 2);
  },
  snap: function(state, pos, override) {
    return pos.z = map[override || state.level.mode](state, pos);
  },
  lerp: function(state, pos, override) {
    var target;
    target = map[override || state.level.mode](state, pos);
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


},{}],30:[function(require,module,exports){
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


},{}],31:[function(require,module,exports){
var east, mul, ne, north, nw, se, south, sw, west;

north = new THREE.Vector3(0, -1, 0);

south = new THREE.Vector3(0, 1, 0);

west = new THREE.Vector3(-1, 0, 0);

east = new THREE.Vector3(1, 0, 0);

nw = new THREE.Vector3(-1, -1, 0);

ne = new THREE.Vector3(1, -1, 0);

sw = new THREE.Vector3(-1, 1, 0);

se = new THREE.Vector3(1, 1, 0);

mul = function(vec, factor) {
  return vec.clone().multiplyScalar(factor);
};

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
  },
  skip: {
    w: mul(north, 2),
    d: mul(east, 2),
    s: mul(south, 2),
    a: mul(west, 2)
  }
};


},{}]},{},[10]);
