function FilePicker({ onSelect }) {
  function handleChange(event) {
    const file = event.target.files[0];

    if (file) {
      onSelect(file);
    }
  }

  return (
    <input
      type="file"
      accept=".glb,.gltf"
      onChange={handleChange}
    />
  );
}

export default FilePicker;