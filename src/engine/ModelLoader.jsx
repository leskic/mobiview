import { useGLTF } from "@react-three/drei";

function ModelLoader({ url }) {
  const { scene } = useGLTF(url);

  return <primitive object={scene} />;
}

export default ModelLoader;