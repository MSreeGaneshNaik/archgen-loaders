// The Three.js classes the blog figures use; build.mjs bundles just these (tree-shaken) into assets/vendor/three.min.js.
export {
  Box3, BoxGeometry, BufferGeometry, CanvasTexture, Color, CylinderGeometry, DirectionalLight, EdgesGeometry, ExtrudeGeometry,
  Group, HemisphereLight, InstancedMesh, Line, LineBasicMaterial, LineLoop, LineSegments, Matrix4, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, NoToneMapping, PCFShadowMap, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, RepeatWrapping,
  SRGBColorSpace, Scene, ShadowMaterial, Shape, Sphere, Vector3, WebGLRenderer,
} from "three";
