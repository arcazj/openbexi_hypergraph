import * as THREE from 'three';

export class Grid {
    constructor(scene, gridSize = 25, divisions = 250) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.divisions = divisions;
        this.gridDots = [];
        this.dotGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]);
        this.dotMaterial = new THREE.PointsMaterial({ size: 0.1, sizeAttenuation: false, color: 0x000000 }); // Black color
    }

    create() {
        const step = this.gridSize / this.divisions;
        for (let i = -this.gridSize / 2; i <= this.gridSize / 2; i += step) {
            for (let j = -this.gridSize / 2; j <= this.gridSize / 2; j += step) {
                const dot = new THREE.Points(this.dotGeometry, this.dotMaterial);
                dot.position.set(i, j, 0);
                this.gridDots.push(dot); // Add the dot to the array
                this.scene.add(dot);
            }
        }
    }

    toggle(show) {
        this.gridDots.forEach(dot => {
            dot.visible = show;
        });
    }

    clear() {
        this.gridDots.forEach(dot => {
            this.scene.remove(dot);
        });
        this.gridDots = [];
    }
}
