import "./App.css";
import React from "react";
// import ReactDOM from "react-dom";
import * as THREE from "three";

class App extends React.Component {
  getCube(x, y, z) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x7e31eb });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, z);
    return cube;
  }

  getBall(x, y, z, r, color = "#00ff00") {
    const geometry = new THREE.SphereGeometry(r, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    return sphere;
  }

  getBufferGeo(data, color = 0x00ff00) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(data);
    geometry.getAttribute("position", new THREE.BufferAttribute(vertices, 3));
    // geometry.attributes.position.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  drawQuad(points) {
    if (points.length !== 4) {
      console.log("Zła liczba punktów!");
      return;
    }
    const newPoints = [];
    newPoints.push(points[0]);
    newPoints.push(points[1]);
    newPoints.push(points[2]);
    newPoints.push(points[2]);
    newPoints.push(points[3]);
    newPoints.push(points[0]);
    return newPoints.flat();
  }

  //points - two dimensional array of vertices(n x 3)
  getLine(points, color) {
    const material = new THREE.LineBasicMaterial({ color });
    const geometry = new THREE.BufferGeometry().setFromPoints(
      this.pointsToVector3(points)
    );
    const line = new THREE.Line(geometry, material);
    return line;
  }

  pointsToVector3(points) {
    const vectors = points.map(
      (point) => new THREE.Vector3(point[0], point[1], point[2])
    );
    return vectors;
  }

  getTexture(addr = "./resources/gray.png") {
    const texture = new THREE.TextureLoader().load(addr);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  getSpiral(distance) {
    //generate points
    const points = [[]];
    const PI = Math.PI;
    const incr = 0.1;
    const T = 0.1;
    const U = 0.1;
    for (let t = 0, i = 0; t < 8 * PI; t += T, i++) {
      points.push([]);
      for (let u = 0; u < 2 * PI; u += U) {
        const x1 = Math.sin(t) * (3 + Math.cos(u));
        const y1 = Math.cos(t) * (3 + Math.cos(u)) + distance;
        const z1 = 0.6 * t + Math.sin(u);

        const x2 = Math.sin(t) * (3 + Math.cos(u + incr));
        const y2 = Math.cos(t) * (3 + Math.cos(u + incr)) + distance;
        const z2 = 0.6 * t + Math.sin(u + incr);

        const x3 = Math.sin(t + incr) * (3 + Math.cos(u));
        const y3 = Math.cos(t + incr) * (3 + Math.cos(u)) + distance;
        const z3 = 0.6 * (t + incr) + Math.sin(u);

        const x4 = Math.sin(t + incr) * (3 + Math.cos(u + incr));
        const y4 = Math.cos(t + incr) * (3 + Math.cos(u + incr)) + distance;
        const z4 = 0.6 * (t + incr) + Math.sin(u + incr);

        points[i].push([
          [x1, y1, z1],
          [x2, y2, z2],
          [x4, y4, z4],
          [x3, y3, z3]
        ]);
      }
    }
    points.length = points.length - 1;

    const arrPoints = [];
    points.flat().forEach((q) => {
      const p = this.drawQuad(q, "#00ff00");
      arrPoints.push(p);
    });
    return arrPoints.flat();
  }

  componentDidMount() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 40);
    camera.lookAt(0, 0, 0);
    const pivot = new THREE.Group();
    pivot.position.set(0, 0, 0);
    pivot.add(camera);
    scene.add(pivot);

    const axesHelper = new THREE.AxesHelper(125);
    scene.add(axesHelper);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    this.mount.appendChild(renderer.domElement);

    const spiral = this.getBufferGeo(this.getSpiral(0));

    scene.add(spiral);
    spiral.rotation.x = Math.PI / 2;
    spiral.position.set(0, 18, 0);

    const ball = this.getBall(0, -9, 0, 5);
    scene.add(ball);

    // const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    const light = new THREE.AmbientLight(0xffffff);
    scene.add(light);

    let dis = 0;
    let inc = false;
    const animate = () => {
      // const pos = spiral.geometry.attributes.position.array;
      if (ball.position.y < -20 || ball.position.y > -6) {
        inc = !inc;
      }
      if (inc) {
        // const newSpring = this.getSpiral(++dis);
        // pos.forEach((e, i, a) => {
        //   e = newSpring[i];
        // });
        ball.position.y -= 0.08;
      } else {
        ball.position.y += 0.08;
      }
      spiral.geometry.computeBoundingBox();
      spiral.geometry.computeBoundingSphere();
      renderer.render(scene, camera, animate);
      requestAnimationFrame(animate);
    };

    this.addCameraEvents(renderer, camera, animate, pivot); //przyspiesza animacje xD
    renderer.render(scene, camera, animate);
    animate(this);
  }

  addCameraEvents(renderer, camera, animate, pivot) {
    let press = false;
    renderer.domElement.addEventListener("mousemove", (event) => {
      if (!press) {
        return;
      }
      const sensitivity = 0.01;

      pivot.rotation.x -= event.movementY * sensitivity;
      pivot.rotation.y -= event.movementX * sensitivity;
    });
    renderer.domElement.addEventListener("mousedown", (event) => {
      press = true;
    });
    renderer.domElement.addEventListener("mouseup", (event) => {
      press = false;
    });
    renderer.domElement.addEventListener("mouseleave", (event) => {
      press = false;
    });
    renderer.domElement.addEventListener("wheel", (event) => {
      const direction = event.wheelDelta;
      if (direction > 0) {
        camera.position.z--;
      } else {
        camera.position.z++;
      }
    });
    renderer.domElement.addEventListener("dblclick", (event) => {
      pivot.rotation.set(0, 0, 0);
      pivot.position.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
      camera.position.set(0, 0, 40);
    });
  }

  render() {
    return (
      <>
        <div className="App" ref={(ref) => (this.mount = ref)}></div>
      </>
    );
  }
}

export default App;
