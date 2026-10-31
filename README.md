# K-pop Room

A lightweight 3D virtual fan-room builder. Users can decorate a miniature room with generated albums, posters, and lightsticks, save locally, export a PNG, and copy a shareable URL.

## Run

```bash
npm install
npm run dev
```

## Features

- True 3D room built with React, Three.js, `@react-three/fiber`, and `@react-three/drei`
- Custom icon editor for album, poster, and lightstick designs
- Local autosave with manual save, reset, undo, redo, duplicate, and delete
- URL-hash sharing with read-only shared preview and `Edit a copy`
- PNG export from the WebGL canvas
- Desktop drag-to-room plus click/tap placement for touch devices

The MVP intentionally avoids real idol photos, copyrighted group names, and uploads. Custom items are generated from structured icon settings.
