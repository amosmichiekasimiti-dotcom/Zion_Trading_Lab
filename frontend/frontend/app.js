function switchMode(mode) {
  fetch(`/mode/${mode}`)
    .then(res => res.json())
    .then(data => {
      alert("Switched to " + data.mode.toUpperCase());
    });
}
