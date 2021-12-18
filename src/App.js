import "./App.css";
import React from "react";
// import ReactDOM from "react-dom";
import * as THREE from "three";

class App extends React.Component {
  getCube(x, y, z) {
    const geometry = new THREE.BoxGeometry(x, y, z);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    return cube;
  }

  getBall(x, y, z, r, color = 0xff00ff) {
    const geometry = new THREE.SphereGeometry(r, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    return sphere;
  }

  getCylinder(radius, height) {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const cylinder = new THREE.Mesh(geometry, material);
    return cylinder;
  }

  //this.getBall(0, 18, 3, 0.97, 0xffff00);
  getConnector() {
    const connector = new THREE.Group();
    const ballUp = this.getBall(0, 3, 3, 0.97, 0x0000ff);
    const connectorHorizontal = this.getCylinder(1, 3);
    connectorHorizontal.position.set(0, 1.5, 0);
    const ballMid = this.getBall(0, 3, 0, 0.97, 0x0000ff);
    const connectorVertical = this.getCylinder(1, 3);
    connectorVertical.rotateX(Math.PI / 2);
    connectorVertical.position.set(0, 3, 1.5);
    const ballDown = this.getBall(0, 0, 0, 0.97, 0x0000ff);
    connector.add(
      ballUp,
      connectorHorizontal,
      ballMid,
      connectorVertical,
      ballDown
    );
    return connector;
  }

  getSpringGeometry(data) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(data);
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    // geometry.setDrawRange(0, 3900);
    return geometry;
  }

  getSpringMesh(data, color = 0x00ff00) {
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(this.getSpringGeometry(data), material);
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

  getSpringPoints(distance) {
    const points = [[]];
    const PI = Math.PI;
    const combine = 0.25;
    const incr = combine;
    const T = combine;
    const U = combine;
    for (let t = 0, i = 0; t < 8 * PI; t += T, i++) {
      points.push([]);
      for (let u = 0; u < 2 * PI; u += U) {
        const x1 = Math.sin(t) * (3 + Math.cos(u));
        const y1 = Math.cos(t) * (3 + Math.cos(u));
        const z1 = 0.6 * t * distance + Math.sin(u);

        const x2 = Math.sin(t) * (3 + Math.cos(u + incr));
        const y2 = Math.cos(t) * (3 + Math.cos(u + incr));
        const z2 = 0.6 * t * distance + Math.sin(u + incr);

        const x3 = Math.sin(t + incr) * (3 + Math.cos(u));
        const y3 = Math.cos(t + incr) * (3 + Math.cos(u));
        const z3 = 0.6 * (t + incr) * distance + Math.sin(u);

        const x4 = Math.sin(t + incr) * (3 + Math.cos(u + incr));
        const y4 = Math.cos(t + incr) * (3 + Math.cos(u + incr));
        const z4 = 0.6 * (t + incr) * distance + Math.sin(u + incr);

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
      const p = this.drawQuad(q, "#00ffff");
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

    //sufit
    const ceil = this.getCube(10, 5, 10);
    ceil.position.set(0, 22, 0);
    scene.add(ceil);

    //łącznik na której wisi sprężyna
    const connectorUpper = this.getConnector();
    connectorUpper.rotation.z = Math.PI;
    connectorUpper.position.y = 21;
    scene.add(connectorUpper);

    //sprezyna
    const spring = this.getSpringMesh(this.getSpringPoints(1));
    scene.add(spring);
    spring.rotation.x = Math.PI / 2;
    spring.position.set(0, 18, 0);

    //łącznik na której wisi kulka
    const connectorLower = this.getConnector();
    scene.add(connectorLower);

    //kulka zawieszona na spręzynie
    const ball = this.getBall(0, -5, 0, 5);
    scene.add(ball);

    //grupa łącząca kulkkę i łącznik dolny do animacji
    const weight = new THREE.Group(connectorLower, ball);
    // weight.position.set(0, 0, 0);
    // scene.add(weight);

    //swiatlo
    const light = new THREE.AmbientLight(0xffffff);
    scene.add(light);

    let distance = 1;
    let incFlag = true;
    let inspector = 3;
    const incBall = 0.5;
    const incSpring = 0.05;
    const animate = () => {
      const positions = spring.geometry.attributes.position.array;
      if (inspector < -6 || inspector > 6) {
        incFlag = !incFlag;
      }
      if (incFlag) {
        distance += incSpring;
        const newPoints = this.getSpringPoints(distance);
        for (let i = 0; i < newPoints.length; i++) {
          positions[i] = newPoints[i];
        }
        connectorLower.position.y = 15 - newPoints[newPoints.length - 1];
        ball.position.y = 7 - newPoints[newPoints.length - 1];
        inspector -= incBall;
      } else {
        distance -= incSpring;
        const newPoints = this.getSpringPoints(distance);
        for (let i = 0; i < newPoints.length; i++) {
          positions[i] = newPoints[i];
        }
        connectorLower.position.y = 15 - newPoints[newPoints.length - 1];
        ball.position.y = 7 - newPoints[newPoints.length - 1];
        inspector += incBall;
      }

      spring.geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera, animate);
      requestAnimationFrame(animate);
    };

    this.addCameraEvents(renderer, camera, animate, pivot);
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
