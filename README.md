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

## Wearable Bridge

StepCast includes a generic wearable bridge endpoint. This lets a watch, phone, automation, or local helper app send step data into the overlay.

Send a total step count:

```bash
curl -X POST http://localhost:4173/api/wearable \
  -H "Content-Type: application/json" \
  -d "{\"steps\":12800,\"source\":\"wearable\",\"deviceName\":\"Apple Watch\"}"
```

Send an incremental step update:

```bash
curl -X POST http://localhost:4173/api/wearable \
  -H "Content-Type: application/json" \
  -d "{\"delta\":250,\"source\":\"wearable\",\"deviceName\":\"Fitbit\"}"
```

Payload fields:

- `steps`: absolute step count to show.
- `delta`: steps to add to the current count.
- `source`: optional source label, usually `wearable`.
- `deviceName`: optional device label shown in the control panel and overlay metadata.
- `goal`: optional daily or stream goal.

Wearables usually do not send directly to OBS. For Apple Health, Fitbit, Garmin, Google Fit, or Samsung Health, use a small companion app, shortcut, automation, or bridge script that reads the wearable data and posts it to `/api/wearable`.

If you post from another device on the same network, replace `localhost` with the streamer's computer IP address, for example:

```text
http://192.168.1.50:4173/api/wearable
```

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
