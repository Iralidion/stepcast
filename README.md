# StepCast

StepCast is a local pedometer overlay for Twitch streams. Run it on the streamer's computer, add the overlay URL to OBS, and update steps manually or from a wearable bridge.

## Quick Start

1. Start StepCast:

```bash
npm start
```

or:

```bash
node server.js
```

2. Open the control panel:

```text
http://localhost:4173/
```

3. Add this URL as an OBS Browser Source:

```text
http://localhost:4173/?mode=overlay
```

Recommended OBS size:

```text
Width: 1280
Height: 720
```

## Updating Steps

You have two simple options.

### Manual Mode

Use the control panel to type the current step count, change the goal, pick a theme, and position the overlay.

### Wearable Mode

Send step data to the local wearable endpoint:

```bash
curl -X POST http://localhost:4173/api/wearable \
  -H "Content-Type: application/json" \
  -d "{\"steps\":12800,\"deviceName\":\"Apple Watch\"}"
```

To add steps instead of replacing the total:

```bash
curl -X POST http://localhost:4173/api/wearable \
  -H "Content-Type: application/json" \
  -d "{\"delta\":250,\"deviceName\":\"Fitbit\"}"
```

For a phone or watch bridge on the same network, replace `localhost` with the streamer's computer IP address:

```text
http://192.168.1.50:4173/api/wearable
```

Apple Health, Fitbit, Garmin, Google Fit, and Samsung Health usually need a companion app, shortcut, automation, or small bridge script that reads the wearable data and posts it to this endpoint.

## Overlay Options

You can customize the OBS URL:

```text
http://localhost:4173/?mode=overlay&theme=neon&align=bottom-right&scale=100
```

- `theme=neon`, `theme=sunset`, or `theme=mono`
- `align=top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, or `bottom-right`
- `scale=80` to `scale=150`

## Project Files

```text
index.html    Control panel and overlay markup
styles.css    App and OBS overlay styling
app.js        UI state, controls, and sync
server.js     Local server, /api/state, and /api/wearable
```
