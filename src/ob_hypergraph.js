import * as THREE from 'three';
import {OrbitControls} from '/three/examples/jsm/controls/OrbitControls.js';
import {DragControls} from '/three/examples/jsm/controls/DragControls.js';
import {FontLoader} from "/three/examples/jsm/loaders/FontLoader.js";
import {TextGeometry} from '/three/examples/jsm/geometries/TextGeometry.js';
import {Grid} from './ob_grid.js';
import {LocalStorage} from './ob_local_storage.js';
import SpriteText from "three-spritetext";

function OB_HYPERGRAPH(models) {

    this.models = models;
    this.hypergraph_name = null;
    this.hypergraph_file = null;

    const vertices = {};
    const edges = [];
    const edgeTexts = [];

    const loader = new FontLoader();

    const fontCache = {};  // Cache loaded fonts
    const materialCache = {};  // Cache materials based on color

    let scene = null;
    let camera = null;
    let renderer = null;

    OB_HYPERGRAPH.prototype.initSceneHyperGraph = function () {
        scene = new THREE.Scene();
        const aspect = window.innerWidth / window.innerHeight;
        camera = new THREE.OrthographicCamera(-aspect * 10, aspect * 10, 10, -10, 1, 1000);
        camera.position.z = 10;
        camera.lookAt(0, 0, 0);
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xFFFFFF);
    }

    OB_HYPERGRAPH.prototype.initMenuHyperGraph = function () {

        // Init grid
        const grid = new Grid(scene);
        grid.create();

        document.getElementById('container').appendChild(renderer.domElement);
        // Listen for checkbox changes
        document.getElementById('showGrid').addEventListener('change', function () {
            grid.toggle(this.checked);  // Pass the checked status to the function
        });
        // Event listener for the save icon click
        document.getElementById('saveIcon').addEventListener('click', () => this.saveHyperGraph(vertices, edges));
        document.getElementById('loadIcon').addEventListener('click', () => this.loadHyperGraph(this.models));
        document.getElementById('hypergrah_name').innerText = this.hypergraph_name;
        document.addEventListener('DOMContentLoaded', () => {
            const selectionContainer = document.getElementById('menu'); // Assuming 'menu' is where we want to insert the dropdown
            let dropdownExists = false;

            document.getElementById('loadIcon').addEventListener('click', () => {
                if (!dropdownExists) {
                    let dropdown = document.createElement('select');
                    dropdown.id = 'modelDropdown';
                    dropdown.innerHTML = this.models.map(model => `<option value="${model.name}">${model.name}</option>`).join('');

                    selectionContainer.appendChild(dropdown);
                    dropdownExists = true;

                    // Event listener for selection change
                    dropdown.addEventListener('change', (event) => {
                        const selectedModelName = event.target.value;
                        this.hypergraph_file = selectedModelName;
                        this.loadHyperGraph(this.hypergraph_file);
                    });
                }

                // Focus the dropdown to expand it
                document.getElementById('modelDropdown').style.display = 'block';
                document.getElementById('modelDropdown').focus();
            });
        });
    }

    OB_HYPERGRAPH.prototype.cleanMaterial = function (material) {
        material.dispose(); // Dispose the material itself
        // Dispose textures
        if (material.map) material.map.dispose();
        if (material.lightMap) material.lightMap.dispose();
        if (material.bumpMap) material.bumpMap.dispose();
        if (material.normalMap) material.normalMap.dispose();
        if (material.displacementMap) material.displacementMap.dispose();
        if (material.specularMap) material.specularMap.dispose();
        if (material.emissiveMap) material.emissiveMap.dispose();
        if (material.alphaMap) material.alphaMap.dispose();
        if (material.roughnessMap) material.roughnessMap.dispose();
        if (material.metalnessMap) material.metalnessMap.dispose();
        if (material.envMap) material.envMap.dispose();
    }

    OB_HYPERGRAPH.prototype.clean_scene = function () {
        while (scene.children.length > 0) {
            let object = scene.children[0];
            if (object.isMesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(this.cleanMaterial);
                    } else {
                        this.cleanMaterial(object.material);
                    }
                }
            }
            scene.remove(object);
        }
    }

// Load model
    OB_HYPERGRAPH.prototype.loadHyperGraph = function (selectedModelName) {
        // Find the model object by name
        const model = this.models.find(m => m.name === selectedModelName);
        if (model) {
            // Logic to read the JSON file and process the data
            fetch(model.name)
                .then(response => response.json())
                .then(data => {
                    this.clean_scene();
                    this.initMenuHyperGraph();
                    this.createGraphFromJSON(model.name);
                    console.log('Loaded model data:', data);
                })
                .catch(error => {
                    console.error('Error loading the model:', model.name, error);
                });
        }
    }

// Save model
    OB_HYPERGRAPH.prototype.saveHyperGraph = function (vertices, edges) {
        // Assuming 'hypergraph_name' is a variable holding the name of your hypergraph
        const graphState = {
            hypergraph: {
                name: this.hypergraph_file,
                vertices: Object.values(vertices).map(vertex => ({
                    id: vertex.vertex.id,
                    name: vertex.vertex.name,
                    type: vertex.vertex.type,
                    attributes: vertex.vertex.attributes,
                    position: {
                        x: vertex.position.x,
                        y: vertex.position.y,
                        z: vertex.position.z
                    },
                    size: vertex.vertex.size,
                    rendering: {
                        color: vertex.material.color.getStyle(), // Get the color style
                        texture: vertex.vertex.rendering.texture,
                        transparent: vertex.material.transparent,
                        opacity: vertex.material.opacity,
                        textColor: vertex.vertex.rendering.textColor // Ensure this property exists on your vertex object
                    }
                })),
                edges: Object.values(edges).map(edge => {
                    // Check if rendering is defined and has a color property
                    const edgeColor = edge.mesh.edge.rendering && edge.mesh.edge.rendering.color
                        ? edge.mesh.edge.rendering.color
                        : '#050505';
                    const edgeTextColor = edge.mesh.edge.rendering && edge.mesh.edge.rendering.textColor
                        ? edge.mesh.edge.rendering.textColor
                        : '#050505';
                    // Check if controlPoints exists and is not undefined
                    const controlPoints = edge.mesh.edge.controlPoints ? edge.mesh.edge.controlPoints.map(cp => {
                        return {x: cp.x, y: cp.y, z: cp.z};
                    }) : [];
                    return {
                        ids: edge.mesh.edge.ids,
                        text: edge.mesh.edge.text,
                        type: edge.mesh.edge.type,
                        controlPoints: controlPoints, // Use the variable here
                        rendering: {
                            color: edgeColor,
                            textColor: edgeTextColor,
                            //wireframe: edge.mesh.edge.rendering.wireframe,
                            //transparent: edge.mesh.edge.rendering.transparent,
                            //opacity: edge.mesh.edge.rendering.opacity
                        }
                    };
                })
            }
        };

        // Create a blob and trigger a download
        const blob = new Blob([JSON.stringify(graphState)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = this.hypergraph_file;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

// Load model:
// Function to load JSON from a specified path
    OB_HYPERGRAPH.prototype.loadJSON = function (path) {
        return fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch((error) => {
                console.error('Error while fetching JSON:', error);
            });
    }

// Function to get verticesJSON from the hypergraph data
    OB_HYPERGRAPH.prototype.getHypergraph = function (hypergraph_file) {
        return this.loadJSON(hypergraph_file)
            .then(data => {
                if (data && data.hypergraph) {
                    document.getElementById('hypergrah_name').innerText = data.hypergraph.name;
                    return data.hypergraph;
                } else {
                    throw new Error('Invalid JSON structure');
                }
            })
            .catch((error) => {
                console.error('Error while getting vertices:', error);
            });
    }

    OB_HYPERGRAPH.prototype.addTextLabel = function (mesh) {
        const vertex = mesh.vertex;
        const rendering = vertex.rendering || {};

        if (!rendering.textColor) {
            rendering.textColor = "#050505";
        }

        const fontKey = 'helvetiker_bold';  // Could be dynamic in a more advanced setup
        const materialKey = rendering.textColor;

        // Use cached material if available
        let material = materialCache[materialKey];
        if (!material) {
            material = new THREE.MeshBasicMaterial({color: rendering.textColor});
            materialCache[materialKey] = material;
        }

        // Use cached font if available, else load it
        if (fontCache[fontKey]) {
            this.createTextMesh(mesh, fontCache[fontKey], material);
        } else {
            let that = this;
            loader.load('three/examples/fonts/helvetiker_bold.typeface.json', function (font) {
                fontCache[fontKey] = font;
                that.createTextMesh(mesh, font, material);
            });
        }
    }

    OB_HYPERGRAPH.prototype.add_text_sprite = function (ob_scene_index, mesh, text, x, y, z, backgroundColor,
                                                      fontSize, fontStyle, fontWeight, color, fontFamily, font_align) {
        color = color || this.track[ob_scene_index](new THREE.Color("rgb(114, 171, 173)"));
        let ob_sprite = this.track[ob_scene_index](new SpriteText(text, 10));
        ob_sprite.color = color;
        ob_sprite.fontFamily = fontFamily;
        ob_sprite.textHeight = parseInt(fontSize);
        ob_sprite.fontSize = parseInt(fontSize);
        ob_sprite.fontStyle = fontStyle;
        ob_sprite.padding = 0.1;
        ob_sprite.borderWidth = 0;
        ob_sprite.fontWeight = fontWeight;
        ob_sprite.borderRadius = 0;
        if (backgroundColor !== undefined)
            ob_sprite.backgroundColor = backgroundColor;

        let ob_x = x;
        if (this.ob_scene[ob_scene_index].ob_camera_type !== "Orthographic") {
            ob_x -= 32;
            z = text.toString().length * 3.2;
        }

        ob_sprite.position.set(ob_x, y, z);
        ob_sprite.pos_x = ob_x;
        ob_sprite.pos_y = y;
        ob_sprite.pos_z = z;

        if (mesh !== undefined) {
            mesh.add(ob_sprite);
        }
    };

    OB_HYPERGRAPH.prototype.createTextMesh = function (mesh, font, material) {
        const geometry = new TextGeometry(mesh.vertex.name, {
            font: font,              // Loaded font
            size: 0.2,               // Size of the text
            height: 0.05,            // How much extrusion (how thick / deep are the letters)
        });

        // Calculate the bounding box to get dimensions
        geometry.computeBoundingBox();
        const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;

        const textMesh = new THREE.Mesh(geometry, material);

        // Center the text relative to the mesh
        textMesh.position.set(
            -textWidth / 2, // Center on X-axis
            mesh.vertex.size.height / 2 + 0.2, // Position above the mesh
            4 // Z-axis
        );

        mesh.add(textMesh);
    }

    OB_HYPERGRAPH.prototype.addEndpointCircles = function (mesh) {
        const geometry = new THREE.CircleGeometry(0.05, 32);
        const material = new THREE.MeshBasicMaterial({color: 0xff0000});

        // Calculate the dimensions of the mesh
        const box = new THREE.Box3().setFromObject(mesh);
        const size = box.getSize(new THREE.Vector3());

        // Calculate positions for the endpoints
        const south = new THREE.Vector3(0, -size.y / 2, 0);
        const north = new THREE.Vector3(0, size.y / 2, 0);
        const east = new THREE.Vector3(size.x / 2, 0, 0);
        const west = new THREE.Vector3(-size.x / 2, 0, 0);

        // Create and position the endpoint circles
        const positions = [south, north, east, west];
        positions.forEach((position) => {
            const circle = new THREE.Mesh(geometry, material);
            circle.position.copy(position);
            mesh.add(circle);  // Attach the circle to the mesh
        });
    }

    OB_HYPERGRAPH.prototype.updateJSON = function (jsonObject, paddingW = 0.6, paddingH = 0.2) {
        // Helper function to calculate grid size
        function calculateGridSize(numChildren) {
            return Math.ceil(Math.sqrt(numChildren));
        }

        jsonObject.forEach(parent => {
            let numChildren = parent.vertices ? parent.vertices.length : 0;
            let gridSize = calculateGridSize(numChildren);
            let totalWidth = 0;
            let totalHeight = 0;

            // Calculate average size if there are children
            if (numChildren > 0) {
                // Check if parent has a texture
                const hasTexture = parent.rendering && parent.rendering.texture;
                if (hasTexture) {
                    //gridSize++;
                    numChildren++;
                }

                parent.numChildren = numChildren;
                parent.vertices.forEach(child => {
                    totalWidth += child.size.width;
                    totalHeight += child.size.height;
                });
                const avgWidth = totalWidth / numChildren;
                const avgHeight = totalHeight / numChildren;

                // Calculate the actual number of rows
                const numRows = Math.ceil(numChildren / gridSize);

                // Calculate total grid dimensions
                const totalGridWidth = gridSize * avgWidth + (gridSize - 1) * paddingW;
                const totalGridHeight = numRows * avgHeight + (numRows - 1) * paddingH;

                // Calculate offsets to position children
                const offsetX = -totalGridWidth / 2 + avgWidth / 2;
                let offsetY = -totalGridHeight / 2 + paddingH;

                // Adjust parent size to encompass all children with padding, including texture mesh if present
                parent.size.width = totalGridWidth + paddingW * 2;
                parent.size.height = totalGridHeight + paddingH * 2 + (hasTexture ? avgHeight + paddingH : 0);

                // Add texture row if necessary
                if (hasTexture) {
                    const textureMesh = {
                        id: "texture",
                        name: "",
                        type: "rectangle",
                        position: {x: 0, y: parent.size.height / 2 - avgHeight + paddingH - paddingH / 2, z: 0},
                        size: {width: avgWidth, height: avgHeight},
                        rendering: {color: "#FFFFFF", texture: parent.rendering.texture}  // Example color
                    };
                    parent.vertices.unshift(textureMesh);
                    // Adjust offsetY for children since the texture mesh takes up space at the top
                    offsetY -= avgHeight / 2 + paddingH;
                }

                // Adjust size and position of each child
                parent.vertices.forEach((child, index) => {
                    if (child.id !== "texture") {
                        // Calculate row and column based on index
                        const row = Math.floor(index / gridSize);
                        const col = index % gridSize;

                        child.position.x = col * (avgWidth + paddingW) + offsetX;
                        child.position.y = row * (avgHeight + paddingH) + offsetY;

                        // Adjust size
                        child.size.width = avgWidth;
                        child.size.height = avgHeight;
                    }
                });
            }
        });

        return jsonObject;
    }


    OB_HYPERGRAPH.prototype.createVerticesFromJSON = function (scene, verticesJSON) {
        const materialCache = {}; // Cache materials based on unique properties
        const geometryCache = {}; // Cache geometries based on unique parameters
        const textureCache = {}; // Cache loaded textures
        const loader = new THREE.TextureLoader();
        const createKey = (obj) => JSON.stringify(obj);

        const processVertex = (vertex, parent = null) => {
            let geometry, material;
            //console.log("Processing vertex:", vertex);

            const {
                color = "#e7d770",
                wireframe = false,
                transparent = true,
                opacity = 1,
                texture = null,
                envMap = null, // Added for environment mapping
                reflectivity = 0.5, // Added for reflectivity control
                refractionRatio = 0.98 // Added for refraction
            } = vertex.rendering || {};

            const materialKey = createKey({color, wireframe, transparent, opacity, texture, envMap, reflectivity, refractionRatio});

            // Reuse material if possible
            if (materialCache[materialKey]) {
                material = materialCache[materialKey];
            } else {
                material = new THREE.MeshBasicMaterial({color, wireframe, transparent, opacity, envMap, reflectivity, refractionRatio});
                if (vertex.numChildren === undefined) {
                    if (texture) {
                        if (textureCache[texture]) {
                            material.map = textureCache[texture];
                        } else {
                            loader.load(texture, (loadedTexture) => {
                                material.map = loadedTexture;
                                material.needsUpdate = true;
                                textureCache[texture] = loadedTexture;
                            });
                        }
                    }
                    if (envMap) {
                        if (textureCache[envMap]) {
                            material.envMap = textureCache[envMap];
                        } else {
                            loader.load(envMap, (loadedTexture) => {
                                material.envMap = loadedTexture;
                                material.needsUpdate = true;
                                textureCache[envMap] = loadedTexture;
                            });
                        }
                    }
                }
                materialCache[materialKey] = material;
            }


            const typeKey = createKey({
                type: vertex.type,
                ...vertex.size,
                ...vertex.radius,
                ...vertex.innerRadius,
                ...vertex.segments,
                ...vertex.thetaSegments
            });

            // Reuse geometry if possible
            if (geometryCache[typeKey]) {
                geometry = geometryCache[typeKey];
            } else {
                switch (vertex.type) {
                    case 'rectangle':
                        geometry = new THREE.BoxGeometry(vertex.size.width, vertex.size.height, 0.1);
                        break;
                    case 'circle':
                        geometry = new THREE.CircleGeometry(vertex.radius, vertex.segments);
                        break;
                    case 'ring':
                        geometry = new THREE.RingGeometry(vertex.innerRadius, vertex.outerRadius, vertex.thetaSegments);
                        break;
                    default:
                        console.warn(`Unknown vertex type: ${vertex.type}`);
                        return;
                }
                geometryCache[typeKey] = geometry;
            }

            // Additional effects for material
            material.refractionRatio = refractionRatio;

            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(vertex.position.x, vertex.position.y, vertex.position.z);
            mesh.vertex = vertex;

            if (parent) {
                vertex.parent = parent;
                mesh.position.set(vertex.position.x, vertex.position.y, 1);
                parent.add(mesh); // Add mesh to its parent
            } else {
                mesh.position.set(vertex.position.x, vertex.position.y, 1);
                scene.add(mesh); // Add mesh to the scene if it has no parent
            }
            vertices[vertex.id] = mesh;

            if (vertex.vertices && vertex.vertices.length) {
                vertex.vertices.forEach(childVertex => processVertex(childVertex, mesh));
            }

            this.addTextLabel(mesh);
            this.addTextAttributes(mesh, vertex.attributes);
            this.addEndpointCircles(mesh);
        };

        verticesJSON.forEach(vertex => processVertex(vertex));
    }

    OB_HYPERGRAPH.prototype.addTextAttributes = function (mesh, attributes) {
        if (attributes === undefined || attributes.length < 1) return;

        // Assuming loader is already defined elsewhere in your code
        loader.load('three/examples/fonts/helvetiker_bold.typeface.json', function (font) {
            const padding = 0.12; // Padding from the top and left of the mesh
            let totalHeight = padding;
            let maxWidth = 0;
            const meshesArray = [];

            // Calculate total height and maximum width of all attributes
            attributes.forEach(attribute => {
                const textGeo = new TextGeometry(attribute.name, {
                    font: font,
                    size: 0.15, // Adjust text size as needed
                    height: 0.1 // Adjust text depth as needed
                });
                textGeo.computeBoundingBox();
                const textHeight = textGeo.boundingBox.getSize(new THREE.Vector3()).y;
                totalHeight += textHeight + padding; // Include padding in the total height
                maxWidth = Math.max(maxWidth, textGeo.boundingBox.getSize(new THREE.Vector3()).x);

                const textColor = attribute.textColor ? attribute.textColor : '#080808';
                const textMaterial = new THREE.MeshBasicMaterial({color: textColor});
                const textMesh = new THREE.Mesh(textGeo, textMaterial);
                meshesArray.push(textMesh);
            });

            // Add padding at the start and end of the text
            totalHeight += padding;

            // Position the text meshes inside the mesh
            let currentPosition = mesh.geometry.boundingBox.max.y - padding; // Start after top padding
            meshesArray.forEach(textMesh => {
                textMesh.geometry.computeBoundingBox();
                const textHeight = textMesh.geometry.boundingBox.getSize(new THREE.Vector3()).y;
                currentPosition -= textHeight / 2; // Center the text vertically

                // Align the text to the left plus padding
                const textWidth = textMesh.geometry.boundingBox.getSize(new THREE.Vector3()).x;
                textMesh.position.x = -(mesh.geometry.boundingBox.getSize(new THREE.Vector3()).x / 2) + padding;
                textMesh.position.y = currentPosition;

                currentPosition -= textHeight / 2 + padding; // Move down for the next text
                mesh.add(textMesh); // Add the text mesh as a child of the main mesh
            });
        });
    }

    OB_HYPERGRAPH.prototype.createEdgesFromJSON = function (scene, edgesJSON) {
        const materialCache = {}; // Cache materials based on unique properties
        const createKey = (obj) => JSON.stringify(obj);

        edgesJSON.forEach((edge) => {
            let curve, material;
            const [start, end] = edge.ids.map(id => vertices[id].position);
            const {
                color = "#070707",
                wireframe = false,
                transparent = true,
                opacity = 1
            } = edge.rendering || {};

            const materialKey = createKey({color, wireframe, transparent, opacity});

            // Reuse material if possible
            if (materialCache[materialKey]) {
                material = materialCache[materialKey];
            } else {
                material = new THREE.MeshBasicMaterial({color, wireframe, transparent, opacity});
                materialCache[materialKey] = material;
            }


            switch (edge.type) {
                case 'CatmullRomCurve':
                    curve = new THREE.CatmullRomCurve3([start.clone(), end.clone()]);
                    break;
                case 'QuadraticBezierCurve':
                    curve = new THREE.QuadraticBezierCurve3(start.clone(), new THREE.Vector3(edge.controlPoint.x, edge.controlPoint.y, edge.controlPoint.z), end.clone());
                    break;
                case 'CubicBezierCurve':
                    curve = new THREE.CubicBezierCurve3(start.clone(), new THREE.Vector3(edge.controlPoints[0].x, edge.controlPoints[0].y, edge.controlPoints[0].z), new THREE.Vector3(edge.controlPoints[1].x, edge.controlPoints[1].y, edge.controlPoints[1].z), end.clone());
                    break;
                case 'Line':
                    curve = new THREE.LineCurve3(start.clone(), end.clone());
                    break;
                // Add more cases as needed
            }

            let points = curve.getPoints(50);
            let geometry = new THREE.BufferGeometry().setFromPoints(points);
            material = new THREE.MeshBasicMaterial(material);
            let mesh = new THREE.Line(geometry, material);
            mesh.edge = edge;
            edges.push({mesh, curve, ids: edge.ids});
            this.addTextToEdge(mesh, curve, edge); // Add text label
            scene.add(mesh);
        });
    }

// Function to get edge positions
    OB_HYPERGRAPH.prototype.getEdgePositions = function (mesh) {
        const pos = mesh.position.clone();
        let offsetX = 0, offsetY = 0, radius = 0;

        switch (mesh.vertex.type) {
            case 'rectangle':
                offsetX = mesh.vertex.size.width / 2;
                offsetY = mesh.vertex.size.height / 2;
                break;
            case 'circle':
            case 'ring':
                radius = mesh.vertex.outerRadius || mesh.vertex.radius;
                offsetX = mesh.vertex.size.width / 2;
                offsetY = mesh.vertex.size.height / 2;
                break;
            default:
                break;
        }

        return {
            north: new THREE.Vector3(pos.x, pos.y + offsetY, pos.z),
            south: new THREE.Vector3(pos.x, pos.y - offsetY, pos.z),
            east: new THREE.Vector3(pos.x + offsetX, pos.y, pos.z),
            west: new THREE.Vector3(pos.x - offsetX, pos.y, pos.z),
        };
    }

// Function to find closest edge
    OB_HYPERGRAPH.prototype.findClosestEdge = function (pos1, pos2, draggedVertex) {
        let minDistance = Infinity;
        let closestEdge1, closestEdge2;
        let edgePair;

        for (const edge1 in pos1) {
            for (const edge2 in pos2) {
                const distance = pos1[edge1].distanceTo(pos2[edge2]);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestEdge1 = edge1; // store the edge name instead of position
                    closestEdge2 = edge2; // store the edge name instead of position
                }
            }
        }

        // Enforce North-to-South and East-to-West connections
        if (draggedVertex === 'obj1') {
            edgePair = this.enforceConnection(closestEdge1, pos1, pos2);
        } else {
            edgePair = this.enforceConnection(closestEdge2, pos2, pos1);
        }

        return [edgePair.edge1, edgePair.edge2];
    }

    OB_HYPERGRAPH.prototype.enforceConnection = function (closestEdge, pos1, pos2) {
        let edgePair;
        if (closestEdge === 'north') {
            edgePair = {edge1: pos1.north, edge2: pos2.south};
        } else if (closestEdge === 'south') {
            edgePair = {edge1: pos1.south, edge2: pos2.north};
        } else if (closestEdge === 'east') {
            edgePair = {edge1: pos1.east, edge2: pos2.west};
        } else if (closestEdge === 'west') {
            edgePair = {edge1: pos1.west, edge2: pos2.east};
        } else {
            // Default to closest edges if no specific connection is enforced
            edgePair = {edge1: pos1[closestEdge], edge2: pos2[closestEdge]};
        }
        return edgePair;
    }

    OB_HYPERGRAPH.prototype.addTextToEdge = function (mesh, curve, edge) {
        if (!curve || !edge?.text) {
            console.error("Either curve, or text is undefined");
            return;
        }

        const loader = new FontLoader();
        loader.load('three/examples/fonts/helvetiker_bold.typeface.json', function (font) {
            const geometry = new TextGeometry(edge.text, {
                font,
                size: 0.16,
                height: 0.1,
            });

            const material = new THREE.MeshBasicMaterial({color: edge.rendering?.color ?? "#050505"});
            const textMesh = new THREE.Mesh(geometry, material);

            // Compute bounding box and find the midpoint
            const midPoint = curve.getPoint(0.5);

            // Position the text at the midpoint
            textMesh.position.set(midPoint.x, midPoint.y, 2);

            // Add the text to the mesh and store the text mesh
            mesh.add(textMesh);
            edgeTexts.push(textMesh);
        });
    }

// Function to update the positions of the edge texts
    OB_HYPERGRAPH.prototype.updateEdgePositions = function () {
        edges.forEach((edge, index) => {
            // Calculate the midpoint of the edge
            const midPoint = edge.curve.getPoint(0.5);
            const textMesh = edgeTexts[index];

            if (textMesh !== undefined) {
                textMesh.position.set(midPoint.x, midPoint.y, 2);  // Original position

                // Additional logic to prevent text overlapping with vertex
                Object.values(vertices).forEach(vertex => {
                    const bufferDistance = 0.5;
                    const deltaX = Math.abs(textMesh.position.x - vertex.position.x);
                    const deltaY = Math.abs(textMesh.position.y - vertex.position.y);
                    const deltaZ = Math.abs(textMesh.position.z - vertex.position.z);

                    if (deltaX < bufferDistance && deltaY < bufferDistance && deltaZ < bufferDistance) {
                        // Change position to prevent overlap (e.g., elevate Z position)
                        textMesh.position.set(midPoint.x, midPoint.y, vertex.position.z + vertex.vertex.size.height + bufferDistance);
                    }
                });
            }
        });
    }


// Function to check for overlaps between all vertices
    OB_HYPERGRAPH.prototype.checkOverlap = function () {
        const bufferDistance = 1; // Minimum distance vertices should maintain from each other

        const keys = Object.keys(vertices);
        for (let i = 0; i < keys.length; i++) {
            for (let j = i + 1; j < keys.length; j++) {
                const obj1 = vertices[keys[i]];
                const obj2 = vertices[keys[j]];

                // Skip if either of the vertices is a child of another vertex
                if (obj1.vertex.parent || obj2.vertex.parent) {
                    continue;
                }

                const minDistanceX = obj1.vertex.size.width + bufferDistance;
                const minDistanceY = obj1.vertex.size.height + bufferDistance;

                const deltaX = Math.abs(obj1.position.x - obj2.position.x);
                const deltaY = Math.abs(obj1.position.y - obj2.position.y);

                if (deltaX < minDistanceX && deltaY < minDistanceY) {
                    const diff = new THREE.Vector3().subVectors(obj1.position, obj2.position).normalize();
                    const moveAmount = new THREE.Vector3(minDistanceX - deltaX, minDistanceY - deltaY, 0).multiplyScalar(0.5);

                    obj1.position.add(diff.multiply(moveAmount));
                    obj2.position.sub(diff.multiply(moveAmount));
                }
            }
        }
    }


// Function to check for overlaps between all vertices and adjust positions
    OB_HYPERGRAPH.prototype.checkAndAdjustOverlap = function p() {
        const bufferDistance = 0.05; // Minimum distance vertices should maintain from each other
        const keys = Object.keys(vertices);

        for (let i = 0; i < keys.length; i++) {
            for (let j = i + 1; j < keys.length; j++) {
                const obj1 = vertices[keys[i]];
                const obj2 = vertices[keys[j]];

                // Skip if either of the vertices is a child of another vertex
                if (obj1.vertex.parent || obj2.vertex.parent) {
                    continue;
                }

                const minDistanceX = obj1.vertex.size.width + bufferDistance;
                const minDistanceY = obj1.vertex.size.height + bufferDistance;

                const deltaX = Math.abs(obj1.position.x - obj2.position.x);
                const deltaY = Math.abs(obj1.position.y - obj2.position.y);

                if (deltaX < minDistanceX && deltaY < minDistanceY) {
                    const diff = new THREE.Vector3().subVectors(obj1.position, obj2.position).normalize();
                    const moveAmount = new THREE.Vector3(minDistanceX - deltaX, minDistanceY - deltaY, 0).multiplyScalar(0.5);

                    obj1.position.add(diff.multiply(moveAmount));
                    obj2.position.sub(diff.multiply(moveAmount));

                    // Update the position of the text on the edges
                    this.updateEdgePositions();
                }
            }
        }

        // Additional logic for vertex-to-edge-text overlap
        for (const vertexKey of keys) {
            const vertex = vertices[vertexKey];
            // Skipping vertex if it is a child
            if (vertex.vertex.parent) {
                continue;
            }
            for (const textMesh of edgeTexts) {
                // Existing logic for vertex-to-edge-text overlap...
            }
        }
    }

// Function to handle drag event logic
    OB_HYPERGRAPH.prototype.handleDrag = function (vertex) {
        // Set the z-position of the dragged vertex to 0
        vertex.position.z = 0;

        // Loop through each edge to update its curve and mesh
        edges.forEach((edge) => {
            const edgePositions1 = this.getEdgePositions(vertices[edge.ids[0]]);
            const edgePositions2 = this.getEdgePositions(vertices[edge.ids[1]]);
            let [start, end] = this.findClosestEdge(edgePositions1, edgePositions2, vertex === vertices[edge.ids[0]] ? 'obj1' : 'obj2');

            if (start === undefined || end === undefined)
                [start, end] = edge.ids.map(id => vertices[id].position);

            // Update the curve based on its type
            if (edge.curve instanceof THREE.CatmullRomCurve3) {
                edge.curve.points = [start.clone(), end.clone()];
            } else if (edge.curve instanceof THREE.QuadraticBezierCurve3) {
                edge.curve.v0.copy(start);
                edge.curve.v2.copy(end);
            } else if (edge.curve instanceof THREE.CubicBezierCurve3) {
                edge.curve.v0.copy(start);
                edge.curve.v3.copy(end);
            } else if (edge.curve instanceof THREE.LineCurve3) {
                edge.curve.v1.copy(start);
                edge.curve.v2.copy(end);
            }

            // Update the mesh geometry
            const points = edge.curve.getPoints(50);
            edge.mesh.geometry.setFromPoints(points);
            edge.mesh.geometry.attributes.position.needsUpdate = true;

            // Check for overlaps after each drag event
            this.checkOverlap();
            // Check for overlaps after each drag event and adjust positions
            this.checkAndAdjustOverlap();
            // Update edge positions
            this.updateEdgePositions();

        });
    }

// Animation
    const that = this;
    OB_HYPERGRAPH.prototype.animate = function () {
        requestAnimationFrame(that.animate);
        // Update controls
        that.controls.update();
        renderer.render(scene, camera);
    };

// Function to get vertices and edges from the JSON and read the graph
    OB_HYPERGRAPH.prototype.createGraphFromJSON = function (hypergraph_file) {

        Promise.all([this.getHypergraph(hypergraph_file)]).then(([hypergraph]) => {

            // Camera position
            camera.position.set(0, 0, 20);
            camera.lookAt(0, 0, 0);

            // Orbit controls
            this.controls = new OrbitControls(camera, renderer.domElement);
            this.controls.enableRotate = false;
            hypergraph.vertices = this.updateJSON(hypergraph.vertices, 0.2, 0.6)
            this.createVerticesFromJSON(scene, hypergraph.vertices);
            this.createEdgesFromJSON(scene, hypergraph.edges);

            // Drag controls
            const dragControls = new DragControls(Object.values(vertices), camera, renderer.domElement);

            // Add the event listener
            const that = this;
            dragControls.addEventListener('drag', function (event) {
                that.handleDrag(event.object);
            });

            // Add event listener for drag stop
            dragControls.addEventListener('dragend', function (event) {
                that.checkOverlap();
                Object.values(hypergraph.vertices).forEach(mesh => {
                    that.handleDrag(mesh); // Adjust positions as necessary
                });
            });

            // Perform an initial overlap check after all vertices are created
            Object.values(hypergraph.vertices).forEach(mesh => {
                that.handleDrag(mesh); // Adjust positions as necessary
            });

            this.animate();

        }).catch(error => {
            console.error('Error creating graph from JSON:', error);
        });
    }

// Init scene and camera
    this.initSceneHyperGraph();
// Init menu
    this.initMenuHyperGraph();
}

const models = [
    {name: "models/all_tests.json"},
    {name: "models/basic_cases.json"},
    {name: "models/human_transport.json"},
    {name: "models/Human_transport2.json"},
    {name: "models/hypergraph.json"},
    {name: "models/test.json"}
];

// Init hypergraph
const ob_hyperGraph = new OB_HYPERGRAPH(models);

// Init LocalStorage
const local_storage = new LocalStorage("", "", "");
local_storage.read();

let ob_hypergraph_file = local_storage.ob_hypergraph_file.value;

// Call the function to start loading JSON and creating the graph
ob_hyperGraph.createGraphFromJSON("models/test.json");
