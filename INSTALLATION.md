# Local Whisper Installation Guide

This plugin now uses local OpenAI Whisper instead of the API. Follow these steps to install Whisper on your system.

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

## Installation Options

### Option 1: Standard Installation (Recommended)

1. Install Whisper using pip:
   ```bash
   pip install openai-whisper
   ```

2. Verify installation:
   ```bash
   whisper --help
   ```

### Option 2: Development Installation

If you want the latest features or need to modify Whisper:

1. Clone the repository:
   ```bash
   git clone https://github.com/openai/whisper.git
   cd whisper
   ```

2. Install from source:
   ```bash
   pip install .
   ```

## System-Specific Instructions

### Windows
- Make sure Python is in your PATH
- You may need to use `py -m pip install openai-whisper` instead
- If you encounter FFmpeg issues, install FFmpeg from https://ffmpeg.org/

### macOS
- Install using Homebrew if preferred: `brew install openai-whisper`
- Ensure Xcode command line tools are installed: `xcode-select --install`

### Linux
- Install FFmpeg if not already present: `sudo apt install ffmpeg` (Ubuntu/Debian) or `sudo yum install ffmpeg` (CentOS/RHEL)
- Some distributions may require additional audio libraries

## Plugin Configuration

After installing Whisper:

1. Open Obsidian Settings
2. Go to Community Plugins → Whisper → Settings
3. Configure the following:
   - **Whisper Executable Path**: Usually just `whisper`, or full path like `/usr/local/bin/whisper`
   - **Model Size**: Choose based on your needs:
     - `tiny` (39 MB) - Fastest, least accurate
     - `base` (74 MB) - Good balance (default)
     - `small` (244 MB) - Better accuracy
     - `medium` (769 MB) - High accuracy
     - `large` (1550 MB) - Best accuracy, slowest
   - **Language**: Select your language or use "auto" for detection

## Troubleshooting

### Common Issues

1. **"Whisper not found" error**:
   - Check if Whisper is installed: `whisper --help`
   - Verify the executable path in plugin settings
   - Try using the full path: `which whisper` (Unix) or `where whisper` (Windows)

2. **Permission errors**:
   - On Unix systems, ensure the whisper executable has execute permissions
   - Try running with `python -m whisper` instead

3. **FFmpeg errors**:
   - Install FFmpeg for your system
   - On Windows, ensure FFmpeg is in PATH

4. **Memory errors**:
   - Use a smaller model size (tiny or base)
   - Add `--device cpu` to additional arguments if using GPU fails

### Performance Tips

- Use `base` model for best speed/accuracy balance
- For better performance on supported hardware, models will automatically use GPU acceleration
- Add `--fp16 False` to additional arguments if you encounter precision issues

## Model Downloads

The first time you use each model size, Whisper will download it automatically:
- Models are cached locally for future use
- Download location varies by system but is typically in `~/.cache/whisper/`
- Ensure you have internet connection for initial model downloads