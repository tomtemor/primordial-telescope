# Wavejotter

Wavejotter is a powerful, lightweight audio annotation tool built with Electron and React. Designed for researchers, musicians, and data analysts, it allows you to visualize waveforms, create precise time-stamped regions, and manage audio projects effortlessly.

## ✨ Features

- **Waveform Visualization**: Smooth, interactive waveform display powered by [WaveSurfer.js](https://wavesurfer-js.org/).

- **Precise Annotation**: 
  - **Navigate Mode**: Click to seek and play.
  - **Annotate Mode**: Drag to create labeled regions.
- **Project Management**: Save and Load your work as `.json` project files.
- **File System Integration**: Open local folders to verify and browse your audio library.
- **Playback Controls**: Play, Pause, Stop, and Zoom controls.
- **Keyboard Shortcuts**: Spacebar to toggle playback.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tomtemor/primordial-telescope.git
   cd primordial-telescope
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## 📦 Building for Production

To create an executable for your OS (Windows, macOS, Linux):

```bash
npm run build
```

The output will be in the `dist` folder.

## 📖 Usage Guide

1. **Open Folder**: Click the folder icon in the sidebar to select a directory containing your audio files (`.wav`, `.mp3`, `.ogg`).
2. **Select Track**: Click a file in the sidebar to load its waveform.
3. **Annotate**: 
   - Switch to **Annotate Mode** (Pencil icon).
   - Click and drag on the waveform to create a region.
   - The region will be added to the list on the right.
4. **Edit**: Double-click an item in the annotation list to edit its label.
5. **Save**: Click **Save Project** to export your work to a JSON file.

## 🛠️ Tech Stack

- **Electron**: Cross-platform desktop framework.
- **React**: UI library for building interactive interfaces.
- **Vite**: Next-generation frontend tooling.
- **WaveSurfer.js**: Audio visualization library.
- **TypeScript**: Static typing for robust development.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
