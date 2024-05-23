import * as THREE from '../libs/three.module.min.js';

class Boid {
    constructor() {
        this.position = new THREE.Vector3(
            Math.random() * 400 - 200,
            Math.random() * 400 - 200,
            0  // Z is fixed at 0
        );
        this.velocity = new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            0  // No velocity in the Z direction
        );
        this.acceleration = new THREE.Vector3();
        this.boundary = 200; // Set the boundary for the XY plane
    }

    update(boids) {
        this.acceleration.set(0, 0, 0);
        let separation = this.separate(boids);
        let alignment = this.align(boids);
        let cohesion = this.cohere(boids);

        separation.multiplyScalar(1.5);
        alignment.multiplyScalar(1.0);
        cohesion.multiplyScalar(1.0);

        this.acceleration.add(separation);
        this.acceleration.add(alignment);
        this.acceleration.add(cohesion);

        this.velocity.add(this.acceleration);
        this.velocity.clampLength(0, 4);

        // Constrain velocity to the XY plane
        this.velocity.z = 0;

        this.position.add(this.velocity);

        // Constrain position to the XY plane
        this.position.z = 0;

        // Apply boundary checks
        this.checkBoundaries();
    }

    checkBoundaries() {
        if (this.position.x > this.boundary) {
            this.position.x = this.boundary;
            this.velocity.x *= -1;
        }
        if (this.position.x < -this.boundary) {
            this.position.x = -this.boundary;
            this.velocity.x *= -1;
        }
        if (this.position.y > this.boundary) {
            this.position.y = this.boundary;
            this.velocity.y *= -1;
        }
        if (this.position.y < -this.boundary) {
            this.position.y = -this.boundary;
            this.velocity.y *= -1;
        }
    }

    separate(boids) {
        let desiredSeparation = 25.0;
        let steer = new THREE.Vector3();
        let count = 0;

        for (let boid of boids) {
            let distance = this.position.distanceTo(boid.position);
            if (distance > 0 && distance < desiredSeparation) {
                let diff = new THREE.Vector3().subVectors(this.position, boid.position);
                diff.normalize();
                diff.divideScalar(distance);
                steer.add(diff);
                count++;
            }
        }

        if (count > 0) steer.divideScalar(count);

        if (steer.length() > 0) {
            steer.normalize();
            steer.multiplyScalar(4);
            steer.sub(this.velocity);
            steer.clampLength(0, 0.1);
        }

        return steer;
    }

    align(boids) {
        let neighborDist = 50;
        let sum = new THREE.Vector3();
        let count = 0;

        for (let boid of boids) {
            let distance = this.position.distanceTo(boid.position);
            if (distance > 0 && distance < neighborDist) {
                sum.add(boid.velocity);
                count++;
            }
        }

        if (count > 0) {
            sum.divideScalar(count);
            sum.normalize();
            sum.multiplyScalar(4);
            let steer = new THREE.Vector3().subVectors(sum, this.velocity);
            steer.clampLength(0, 0.1);
            return steer;
        } else {
            return new THREE.Vector3();
        }
    }

    cohere(boids) {
        let neighborDist = 50;
        let sum = new THREE.Vector3();
        let count = 0;

        for (let boid of boids) {
            let distance = this.position.distanceTo(boid.position);
            if (distance > 0 && distance < neighborDist) {
                sum.add(boid.position);
                count++;
            }
        }

        if (count > 0) {
            sum.divideScalar(count);
            return this.seek(sum);
        } else {
            return new THREE.Vector3();
        }
    }

    seek(target) {
        let desired = new THREE.Vector3().subVectors(target, this.position);
        desired.normalize();
        desired.multiplyScalar(4);
        let steer = new THREE.Vector3().subVectors(desired, this.velocity);
        steer.clampLength(0, 0.1);
        return steer;
    }
}

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

let boids = [];
for (let i = 0; i < 100; i++) {
    boids.push(new Boid());
}

let geometry = new THREE.SphereGeometry(1);
let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
let meshes = boids.map(() => new THREE.Mesh(geometry, material));
meshes.forEach(mesh => scene.add(mesh));

// Position the camera to view the XY plane
camera.position.z = 400;

function animate() {
    requestAnimationFrame(animate);

    boids.forEach((boid, i) => {
        boid.update(boids);
        meshes[i].position.copy(boid.position);
    });

    renderer.render(scene, camera);
}
animate();
