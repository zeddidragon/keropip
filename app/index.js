(function() {
  var Bird, CameraController, Goal, LOAD_BUFFER, ModePad, animate, bgmNode, charModes, createEntity, createScene, entityMap, init, level, load, loadCounter, loadQueue, loaded, loaders, resources, tmpMat, tmpVe, validMoves;

  tmpVe = new THREE.Vector3;

  tmpMat = new THREE.Matrix4;

  validMoves = {
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

  charModes = {
    'H': 'hex',
    'O': 'orto'
  };

  bgmNode = document.getElementById('bgm');

  bgmNode.volume = 0.5;

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

  loadQueue = [];

  LOAD_BUFFER = 4;

  load = function(type, path, transforms) {
    var base;
    ++loadCounter;
    loadQueue.push(function() {
      return loaders[type].load("assets/" + path, function(obj) {
        var args, k, len, name, ref, transform;
        name = path.split('/').pop().split('.').shift();
        if (type === 'material') {
          obj = new THREE.MeshBasicMaterial({
            map: obj
          });
        }
        ref = transforms || [];
        for (k = 0, len = ref.length; k < len; k++) {
          [transform, args] = ref[k];
          obj[transform](...args);
        }
        resources[type][name] = obj;
        return loaded();
      });
    });
    if (loadCounter <= LOAD_BUFFER) {
      return typeof (base = loadQueue.pop()) === "function" ? base() : void 0;
    }
  };

  loaded = function() {
    var base, level1, level2;
    if (typeof (base = loadQueue.pop()) === "function") {
      base();
    }
    if (--loadCounter) {
      return;
    }
    level1 = level`########\n #...#O!#\n #.@..###\n #......#\n #....H.#\n #......#\n ########\n`;
    level2 = level`##########\n #........#\n #.###..#.#\n #@#..###.#\n ##.#O###.#\n #!#H.....#\n ##########\n`;
    return requestAnimationFrame(function() {
      return animate(init(level1));
    });
  };

  load('geometry', 'bird/bird.json', [['translate', [0, -5, 0]], ['scale', [0.24, 0.24, 0.24]]]);

  load('material', 'bird/bird_face.png');

  load('material', 'bird/frog_eye.png');

  load('material', 'bird/frog_face.png');

  load('material', 'block.png');

  load('material', 'block2.png');

  load('sfx', 'sfx.json');

  Goal = class Goal {
    constructor(x1, y1) {
      this.x = x1;
      this.y = y1;
      this.type = 'goal';
      this.geometry = resources.geometry.goal;
      this.material = resources.material.goal;
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.reached = false;
    }

    update(state) {
      if (this.reached) {
        return;
      }
      if (!(state.player.x === this.x && state.player.y && this.y)) {
        return;
      }
      this.reached = true;
      return state.sfx.play('explosion');
    }

  };

  ModePad = class ModePad {
    constructor(x1, y1, char) {
      this.x = x1;
      this.y = y1;
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

  Bird = class Bird {
    constructor(x1, y1) {
      this.x = x1;
      this.y = y1;
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
      };
      return document.addEventListener('keydown', this.onKeyDown);
    }

    deinit() {
      return document.removeEventListener('keydown', this.onKeyDown);
    }

    update(state) {
      var name1;
      return typeof this[name1 = this.state] === "function" ? this[name1](state) : void 0;
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

    moving() {
      this.progress += 0.14;
      if (this.progress < 2) {
        this.mesh.rotateOnWorldAxis(this.rollVector, 0.24 * Math.cos(this.progress));
        this.mesh.position.lerpVectors(this.from, this.to, 1.1 * Math.sin(this.progress));
      } else {
        this.mesh.position.copy(this.to);
        this.state = 'idle';
      }
      return this.mesh.position.z = this.mesh.position.y - this.mesh.position.x;
    }

  };

  CameraController = class CameraController {
    constructor(camera1, player1) {
      this.camera = camera1;
      this.player = player1;
      this.state = 'tracking';
      this.offset = new THREE.Vector3(0, 0, 512);
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
          this.to.set(0, 0, 512);
          break;
        case 'hex':
          this.to.set(512, -512, 512);
      }
    }

    tracking() {
      this.camera.position.addVectors(this.player.mesh.position, this.offset);
      return this.camera.lookAt(this.player.mesh.position);
    }

    warping() {
      this.progress += 0.06;
      if (this.progress < 1) {
        this.offset.lerpVectors(this.from, this.to, this.progress);
      } else {
        this.offset.copy(this.to);
        this.state = 'tracking';
      }
      return this.tracking();
    }

    update(state) {
      var name1;
      return typeof this[name1 = this.state] === "function" ? this[name1](state) : void 0;
    }

  };

  entityMap = {
    '@': Bird,
    'H': ModePad,
    'O': ModePad,
    '!': Goal
  };

  createEntity = function(char, x, y) {
    var entity, klass;
    klass = entityMap[char];
    if (!klass) {
      return;
    }
    entity = new klass(x, y, char);
    if (typeof entity.init === "function") {
      entity.init();
    }
    return entity;
  };

  level = function(parts) {
    var entities, player, tiles;
    entities = [];
    player = null;
    tiles = parts.join("\n").trim().split("\n").map(function(str) {
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

  createScene = function(tiles, entities) {
    var block, e, entityScene, geometry, ground, i, j, k, l, len, len1, len2, m, row, solid, tile, tileScene;
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
        block.position.z = -(i + j);
        tileScene.add(block);
      }
    }
    for (m = 0, len2 = entities.length; m < len2; m++) {
      e = entities[m];
      e.mesh.position.x = e.x;
      e.mesh.position.y = -e.y;
      e.mesh.position.z = -(e.x + e.y);
      e.mesh.name = e.type;
      entityScene.add(e.mesh);
    }
    return [tileScene, entityScene];
  };

  init = function(level) {
    var camera, cameraController, height, ratio, renderer, size, width;
    width = window.innerWidth;
    height = window.innerHeight;
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
    camera = new THREE.OrthographicCamera(-width, width, height, -height, 0.01, 2048);
    camera.position.z = 1024;
    camera.position.x = level.width / 2;
    camera.position.y = -level.height / 2;
    cameraController = new CameraController(camera, level.player);
    level.entities.push(cameraController);
    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    document.body.appendChild(renderer.domElement);
    window.block = resources.geometry.block;
    return window.state = {
      level: level,
      player: level.player,
      renderer: renderer,
      camera: camera,
      resources: resources,
      sfx: resources.sfx.sfx,
      cameraController: cameraController
    };
  };

  animate = function(state) {
    var ent, i, k, l, len, len1, ref, ref1, results, scene;
    requestAnimationFrame(function() {
      return animate(state);
    });
    state.renderer.clear();
    ref = state.level.scenes;
    for (i = k = 0, len = ref.length; k < len; i = ++k) {
      scene = ref[i];
      if (i) {
        state.renderer.clearDepth();
      }
      state.renderer.render(scene, state.camera);
    }
    ref1 = state.level.entities;
    results = [];
    for (l = 0, len1 = ref1.length; l < len1; l++) {
      ent = ref1[l];
      results.push(typeof ent.update === "function" ? ent.update(state) : void 0);
    }
    return results;
  };

}).call(this);

//# sourceMappingURL=index.js.map
