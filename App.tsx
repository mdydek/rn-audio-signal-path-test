import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ScrollView } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import Slider from '@react-native-community/slider';
import { AudioContext, AudioBuffer } from 'react-native-audio-api';

export default function App() {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wet/dry mix: 0 = all dry, 1 = all wet
  const [test2Mix, setTest2Mix] = useState(0.5);
  const [test3WetConnected, setTest3WetConnected] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    loadAudioSample();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  async function loadAudioSample() {
    try {
      setLoading(true);
      setError(null);

      // Create audio context if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const context = audioContextRef.current;

      // Generate a short synthesised sound (kick drum-like)
      const sampleRate = context.sampleRate;
      const duration = 0.5; // 500ms
      const length = Math.floor(sampleRate * duration);

      const buffer = context.createBuffer(2, length, sampleRate);

      const leftChannel = buffer.getChannelData(0);
      const rightChannel = buffer.getChannelData(1);

      // Generate a kick drum sound: sine wave with pitch envelope
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;

        // Exponential pitch decay from 150Hz to 50Hz
        const frequency = 150 * Math.exp(-t * 8) + 50;

        // Exponential amplitude envelope
        const amplitude = Math.exp(-t * 8);

        // Generate sine wave
        const value = Math.sin(2 * Math.PI * frequency * t) * amplitude * 0.5;

        leftChannel[i] = value;
        rightChannel[i] = value;
      }

      setAudioBuffer(buffer);
      setLoading(false);
    } catch (err) {
      console.error('Error loading audio:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  // Test 1: sample -> output
  function playTest1() {
    if (!audioBuffer || !audioContextRef.current) return;

    try {
      const context = audioContextRef.current;
      const source = context.createBufferSource();

      source.buffer = audioBuffer;

      source.connect(context.destination);

      source.start();
    } catch (err) {
      console.error('Error in playTest1:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  // Test 2: sample -> wet gain -> filter -> output
  //                \- dry gain ----------/
  function playTest2() {
    if (!audioBuffer || !audioContextRef.current) return;

    try {
      const context = audioContextRef.current;
      const source = context.createBufferSource();
      source.buffer = audioBuffer;

      // Create wet path: gain -> filter
      const wetGain = context.createGain();
      wetGain.gain.value = test2Mix;

      const filter = context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 600;
      filter.Q.value = 1;

      // Create dry path: gain
      const dryGain = context.createGain();
      dryGain.gain.value = 1 - test2Mix;

      // Connect wet path: source -> wetGain -> filter -> destination
      source.connect(wetGain);
      wetGain.connect(filter);
      filter.connect(context.destination);

      // Connect dry path: source -> dryGain -> destination
      source.connect(dryGain);
      dryGain.connect(context.destination);

      source.start();
    } catch (err) {
      console.error('Error in playTest2:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  // Test 3: sample -> wet gain (0%) -> filter -> output (toggled)
  //                \- dry gain (100%) --------/
  function playTest3() {
    if (!audioBuffer || !audioContextRef.current) return;

    try {
      const context = audioContextRef.current;
      const source = context.createBufferSource();
      source.buffer = audioBuffer;

      // Create wet path: gain (0%) -> filter
      const wetGain = context.createGain();
      wetGain.gain.value = 0;

      const filter = context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 600;
      filter.Q.value = 1;

      // Create dry path: gain (100%)
      const dryGain = context.createGain();
      dryGain.gain.value = 1;

      // Connect wet path only if toggled on: source -> wetGain -> filter -> destination
      if (test3WetConnected) {
        source.connect(wetGain);
        wetGain.connect(filter);
        filter.connect(context.destination);
      }

      // Connect dry path: source -> dryGain -> destination
      source.connect(dryGain);
      dryGain.connect(context.destination);

      source.start();
    } catch (err) {
      console.error('Error in playTest3:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading audio sample...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Retry" onPress={loadAudioSample} />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Audio API Signal Path Tests</Text>

      {/* Test 1 */}
      <View style={styles.testSection}>
        <Text style={styles.testTitle}>Test 1: Direct Output</Text>
        <Text style={styles.testDescription}>sample → output</Text>
        <Button title="Play Test 1" onPress={playTest1} />
      </View>

      {/* Test 2 */}
      <View style={styles.testSection}>
        <Text style={styles.testTitle}>Test 2: Wet/Dry Mix with Filter</Text>
        <Text style={styles.testDescription}>
          sample → wet gain → filter → output{'\n'}
          {'       '}↘ dry gain --------↗
        </Text>
        <Text style={styles.sliderLabel}>
          Wet/Dry Mix: {(test2Mix * 100).toFixed(0)}% wet
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={test2Mix}
          onValueChange={setTest2Mix}
          minimumTrackTintColor="#1fb28a"
          maximumTrackTintColor="#d3d3d3"
        />
        <Button title="Play Test 2" onPress={playTest2} />
      </View>

      {/* Test 3 */}
      <View style={styles.testSection}>
        <Text style={styles.testTitle}>Test 3: Toggleable Muted Wet Path</Text>
        <Text style={styles.testDescription}>
          sample → wet gain → filter (toggled) → output{'\n'}
          {'       '}↘ dry gain ------------------↗
        </Text>
        <Text style={styles.sliderLabel}>
          Wet path: {test3WetConnected ? 'Connected (muted)' : 'Disconnected'}
        </Text>
        <Button
          title={test3WetConnected ? 'Disconnect Wet Path' : 'Connect Wet Path'}
          onPress={() => setTest3WetConnected(!test3WetConnected)}
        />
        <View style={{ height: 10 }} />
        <Button title="Play Test 3" onPress={playTest3} />
      </View>

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  testSection: {
    marginBottom: 40,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  testDescription: {
    fontFamily: 'Courier New',
    fontSize: 12,
    marginBottom: 15,
    color: '#666',
  },
  sliderLabel: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
});
