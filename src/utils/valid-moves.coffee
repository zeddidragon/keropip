north = new THREE.Vector3 0, -1, 0
south = new THREE.Vector3 0,  1, 0
west = new THREE.Vector3 -1, 0, 0
east = new THREE.Vector3  1, 0, 0

nw = new THREE.Vector3 -1, -1, 0
ne = new THREE.Vector3  1, -1, 0
sw = new THREE.Vector3 -1,  1, 0
se = new THREE.Vector3  1,  1, 0

module.exports =
  orto:
    w: north
    d: east
    s: south
    a: west
  hex:
    w: north
    e: ne
    d: east
    x: south
    z: sw
    a: west
  diag:
    w: nw
    s: se
    a: sw
    d: ne
  jump:
    w: new THREE.Vector3 -1, -2, 0
    e: new THREE.Vector3  1, -2, 0
    d: new THREE.Vector3  2, -1, 0
    c: new THREE.Vector3  2,  1, 0
    x: new THREE.Vector3  1,  2, 0
    z: new THREE.Vector3 -1,  2, 0
    a: new THREE.Vector3 -2,  1, 0
    q: new THREE.Vector3 -2, -1, 0

