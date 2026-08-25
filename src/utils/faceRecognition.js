import * as faceapi from '@vladmandic/face-api';

const MODELS_URL = '/models';
let modelsLoaded = false;
let modelLoadPromise = null;

/**
 * Load offline face detection and recognition models from /public/models
 */
export async function loadFaceModels() {
  if (modelsLoaded) return true;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    try {
      // Configure faceapi tfjs backend if needed
      await faceapi.tf.ready();

      // Load TinyFaceDetector or SSD MobileNet, 68 Landmarks, and 128-d FaceRecognitionNet
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL).catch(() =>
          faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL)
        ),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
      ]);

      modelsLoaded = true;
      return true;
    } catch (err) {
      console.error('Error loading offline face-api models:', err);
      modelsLoaded = false;
      throw err;
    } finally {
      modelLoadPromise = null;
    }
  })();

  return modelLoadPromise;
}

/**
 * Get enrolled face from localStorage
 * Returns { name: string, descriptor: Float32Array, photo: string } or null
 */
export function getEnrolledFace() {
  try {
    const raw = localStorage.getItem('nexus_enrolled_face');
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      name: data.name || 'Utilisateur Lab',
      descriptor: new Float32Array(data.descriptor),
      photo: data.photo || null,
      enrolledAt: data.enrolledAt || null,
    };
  } catch (e) {
    console.error('Failed to parse enrolled face data:', e);
    return null;
  }
}

/**
 * Save enrolled face descriptor to localStorage
 */
export function saveEnrolledFace(name, descriptor, photoDataUrl) {
  const payload = {
    name: name || 'Utilisateur Lab',
    descriptor: Array.from(descriptor), // Convert Float32Array to standard array for JSON
    photo: photoDataUrl || null,
    enrolledAt: new Date().toISOString(),
  };
  localStorage.setItem('nexus_enrolled_face', JSON.stringify(payload));
}

/**
 * Delete enrolled face from localStorage
 */
export function deleteEnrolledFace() {
  localStorage.removeItem('nexus_enrolled_face');
}

/**
 * Detect a single face with landmarks & 128-d descriptor from a video or image element
 */
export async function detectFaceWithDescriptor(inputElement) {
  if (!modelsLoaded) {
    await loadFaceModels();
  }

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5,
  });

  // Try tiny landmarks first, fallback to standard landmarks
  try {
    return await faceapi
      .detectSingleFace(inputElement, options)
      .withFaceLandmarks(true)
      .withFaceDescriptor();
  } catch {
    return await faceapi
      .detectSingleFace(inputElement, options)
      .withFaceLandmarks(false)
      .withFaceDescriptor();
  }
}

/**
 * Compute Euclidean distance between two face descriptor arrays
 * Distance < 0.5 means a strong match.
 */
export function computeFaceDistance(desc1, desc2) {
  return faceapi.euclideanDistance(desc1, desc2);
}

/**
 * Calculate similarity percentage from Euclidean distance
 */
export function distanceToSimilarity(distance) {
  // Typical match threshold is 0.5. 0.0 distance is 100% match, > 0.6 is 0% match.
  const score = Math.max(0, Math.min(100, Math.round((1 - distance / 0.6) * 100)));
  return score;
}
