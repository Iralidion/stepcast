# StepCast

StepCast is a lightweight browser-based pedometer overlay for Twitch streams. It is designed to run locally and be added to OBS as a Browser Source.

The app has two views:

- A control panel for updating steps, goal, theme, position, and scale.
- A clean overlay mode for OBS with a transparent background.

## Requirements

- Node.js 18 or newer
- OBS Studio

No build step is required.

## Run Locally

From the project folder, start the local server:

```bash
node server.js
```

Open the control panel:

```text
http://localhost:4173/
```

Open the OBS overlay:

```text
http://localhost:4173/?mode=overlay
```

## Add to OBS

1. Open OBS Studio.
2. Add a new source.
3. Choose **Browser**.
4. Set the URL to:

```text
http://localhost:4173/?mode=overlay
```

5. Recommended size:

```text
Width: 1280
Height: 720
```

6. Enable a transparent background if your OBS version shows that option.

The overlay polls the local server for updates, so the control panel and OBS Browser Source stay in sync even if OBS uses a different browser profile.

## URL Options

You can customize the overlay with query parameters:

```text
http://localhost:4173/?mode=overlay&theme=neon&align=bottom-right&scale=100
```

Available options:

- `mode=overlay` shows only the OBS overlay.
- `theme=neon`, `theme=sunset`, or `theme=mono` changes the visual theme.
- `align=top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, or `bottom-right` changes the overlay position.
- `scale=80` to `scale=150` changes the overlay size.

## Sharing With Another Streamer

The easiest way to share StepCast is to send them this repository. They can clone it, run `node server.js`, and add the overlay URL to OBS.

For a public hosted version, add user-specific rooms or stream keys first. The current local server keeps one shared state, which is perfect for one streamer on one machine but not enough for multiple public users at the same time.

## Project Structure

```text
index.html    Control panel and overlay markup
styles.css    App and OBS overlay styling
app.js        UI state, controls, and server sync
server.js     Local static server and /api/state endpoint
```
