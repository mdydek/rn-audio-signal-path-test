# react-native-audio-api Signal Path Tests

Test app for verifying different audio routing configurations in react-native-audio-api.

## Overview

This app tests three different signal path scenarios using a synthesised kick drum sample. Each test verifies that audio nodes connect and process correctly in various configurations.

## Test Scenarios

### Test 1: Direct Output
```
sample → output
```
Basic playback with no processing. Verifies that audio buffer sources can play directly to the destination.

### Test 2: Wet/Dry Mix with Filter
```
sample → wet gain → highpass filter → output
       ↘ dry gain ──────────────────↗
```
Parallel signal paths with adjustable wet/dry mix. The wet signal passes through a 600Hz highpass filter, whilst the dry signal remains unprocessed. A slider controls the balance between the two paths.

**Purpose**: Tests parallel routing and mixing of processed/unprocessed signals.

### Test 3: Toggleable Muted Wet Path
```
sample → wet gain (0%) → highpass filter ─(toggle)─→ output
       ↘ dry gain (100%) ──────────────────────────↗
```
Similar to Test 2, but the wet path is always muted (0% gain) and can be connected or disconnected via a toggle. The dry path always plays at full volume.

**Purpose**: Tests whether a connected but muted signal path affects behaviour differently than a disconnected path.

## Audio Sample

The app generates a 500ms kick drum sound programmatically using:
- Exponential pitch decay (150Hz → 50Hz)
- Exponential amplitude envelope
- Stereo output

## Setup

```bash
npm install
npm run ios    # or npm run android
```

## Requirements

- React Native 0.81.5
- Expo SDK 54
- react-native-audio-api 0.11.2

## Usage

1. Launch the app
2. Wait for the audio sample to generate
3. Tap any test button to hear the configured signal path
4. For Test 2, adjust the slider to change the wet/dry balance
5. For Test 3, toggle the wet path connection on/off

## Technical Notes

- Uses `context.createBufferSource()` for creating audio sources
- Uses `context.createGain()` and `context.createBiquadFilter()` for processing
- All nodes are created fresh for each playback
- AudioContext is created once and reused
