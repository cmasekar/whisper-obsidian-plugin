# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development mode with file watching
- `npm run build` - Build for production (runs TypeScript check and esbuild)
- `npm run release` - Create a release using release-it

### Build Process
- Uses esbuild for bundling (config in `esbuild.config.mjs`)
- TypeScript compilation with `tsc -noEmit -skipLibCheck` for type checking
- Output goes to `main.js` (entry point is `main.ts`)
- Uses environment variable `OUTPUT_PATH` for output directory

## Architecture

This is an Obsidian plugin that provides speech-to-text functionality using local OpenAI Whisper installation.

### Core Components

**Main Plugin (`main.ts`)**
- Entry point extending Obsidian's Plugin class
- Manages plugin lifecycle and component initialization
- Registers commands for recording (Alt+Q hotkey) and file upload
- Creates ribbon icon for recording controls

**Audio Pipeline**
- `AudioRecorder.ts` - Handles browser MediaRecorder API for audio capture
- `AudioHandler.ts` - Manages local Whisper processing and file operations
- `LocalWhisperProcessor.ts` - Handles local Whisper command execution via child processes

**UI Components**
- `Controls.ts` - Modal dialog with record/pause/stop buttons and timer
- `StatusBar.ts` - Shows recording status in Obsidian's status bar
- `WhisperSettingsTab.ts` - Plugin settings interface for local configuration

**Core Services**
- `SettingsManager.ts` - Manages plugin configuration with defaults
- `Timer.ts` - Recording duration tracking
- `utils.ts` - Utility functions including file name processing

### Key Workflows

**Recording Flow**: User starts recording → AudioRecorder captures audio → Timer tracks duration → User stops → LocalWhisperProcessor transcribes locally → Creates note with transcription

**File Upload Flow**: User selects audio file via file dialog → AudioHandler processes file → LocalWhisperProcessor transcribes locally → Creates note with transcription

**Output Options**: Can either create new notes in specified folder or insert transcription at cursor position in active note

### Local Processing

The plugin uses Node.js child processes to execute the local `whisper` command:
- Saves audio blobs to temporary files
- Executes whisper CLI with configured model and language settings
- Reads transcription from output files
- Cleans up temporary files after processing

### Configuration

Settings stored in `SettingsManager.ts` include:
- Whisper executable path (default: 'whisper')
- Model size selection (tiny, base, small, medium, large)
- Language settings (auto-detect or specific language)
- Additional command-line arguments
- File save locations for audio and transcriptions
- Debug mode toggle

### Prerequisites

Users must install OpenAI Whisper locally:
- `pip install openai-whisper`
- Ensure `whisper` command is accessible from PATH
- See INSTALLATION.md for detailed setup instructions

### Dependencies

- `obsidian` - Core Obsidian API  
- Node.js built-ins (`child_process`, `fs`, `path`) for local command execution
- Standard browser APIs (MediaRecorder, File API)

The plugin follows Obsidian's plugin architecture with proper lifecycle management and uses TypeScript with strict null checks enabled.