/**
 * Converts 70 PNG screenshot frames into a watchable MP4 demo video
 * Uses ffmpeg-static (bundled ffmpeg, no system install needed)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to bundled ffmpeg binary
const ffmpegBin = require('ffmpeg-static');

const FRAMES_DIR = path.join(
  os.homedir(),
  '.gemini', 'antigravity', 'brain',
  '14a5c1f1-423e-4783-9c33-cf56bd220ac3',
  '.system_generated', 'click_feedback'
);

const OUTPUT = path.join(__dirname, 'foody_demo.mp4');
const TEMP_DIR = path.join(os.tmpdir(), 'foody_frames_' + Date.now());

console.log('📂 Frames source:', FRAMES_DIR);
console.log('🎬 Output:', OUTPUT);
console.log('🔧 Using ffmpeg:', ffmpegBin);

// Create temp dir
fs.mkdirSync(TEMP_DIR, { recursive: true });

// Get all PNGs sorted by name (timestamps in filename = chronological order)
const frames = fs.readdirSync(FRAMES_DIR)
  .filter(f => f.endsWith('.png'))
  .sort()
  .map(f => path.join(FRAMES_DIR, f));

console.log(`🖼️  Found ${frames.length} frames`);

if (frames.length === 0) {
  console.error('❌ No frames found! Check the frames directory.');
  process.exit(1);
}

// Copy frames with sequential names for ffmpeg
frames.forEach((src, i) => {
  const dst = path.join(TEMP_DIR, `frame_${String(i).padStart(5, '0')}.png`);
  fs.copyFileSync(src, dst);
});

console.log('✅ Frames copied → running ffmpeg...\n');

// Run ffmpeg: 2fps = each frame shows for ~0.5s, full demo ~35 seconds
const result = spawnSync(ffmpegBin, [
  '-framerate', '2',
  '-i', path.join(TEMP_DIR, 'frame_%05d.png'),
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-pix_fmt', 'yuv420p',
  '-crf', '22',
  '-y',
  OUTPUT
], { stdio: 'inherit', timeout: 180000 });

// Cleanup temp
try { fs.rmSync(TEMP_DIR, { recursive: true }); } catch {}

if (result.status === 0) {
  const size = fs.statSync(OUTPUT).size;
  console.log(`\n✅ SUCCESS!`);
  console.log(`📦 File: ${OUTPUT}`);
  console.log(`📐 Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⏱️  Duration: ~${Math.round(frames.length / 2)} seconds`);
  console.log(`\n🎉 Open to watch: ${OUTPUT}`);
} else {
  console.error('\n❌ ffmpeg failed with status:', result.status);
  if (result.error) console.error(result.error.message);
}
