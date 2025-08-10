import Whisper from "main";
import { Notice, MarkdownView } from "obsidian";
import { getBaseFileName } from "./utils";
import { LocalWhisperProcessor, LocalWhisperConfig } from "./LocalWhisperProcessor";

export class AudioHandler {
	private plugin: Whisper;
	private localProcessor: LocalWhisperProcessor | null = null;

	constructor(plugin: Whisper) {
		this.plugin = plugin;
		this.initializeLocalProcessor();
	}

	private initializeLocalProcessor(): void {
		const config: LocalWhisperConfig = {
			whisperPath: this.plugin.settings.whisperPath || 'whisper',
			modelSize: this.plugin.settings.modelSize || 'base',
			language: this.plugin.settings.language || 'auto',
			outputFormat: 'txt',
			additionalArgs: this.plugin.settings.additionalWhisperArgs
		};
		
		this.localProcessor = new LocalWhisperProcessor(config);
	}

	async sendAudioData(blob: Blob, fileName: string): Promise<void> {
		// Get the base file name without extension
		const baseFileName = getBaseFileName(fileName);

		const audioFilePath = `${
			this.plugin.settings.saveAudioFilePath
				? `${this.plugin.settings.saveAudioFilePath}/`
				: ""
		}${fileName}`;

		const noteFilePath = `${
			this.plugin.settings.createNewFileAfterRecordingPath
				? `${this.plugin.settings.createNewFileAfterRecordingPath}/`
				: ""
		}${baseFileName}.md`;

		if (this.plugin.settings.debugMode) {
			new Notice(`Processing audio data size: ${blob.size / 1000} KB`);
		}

		if (!this.localProcessor) {
			new Notice("Local Whisper processor not initialized.");
			return;
		}

		// Check if Whisper is installed
		const isInstalled = await this.localProcessor.checkWhisperInstallation();
		if (!isInstalled) {
			new Notice(
				"Whisper is not installed or not found. Please check your Whisper installation and path in settings."
			);
			return;
		}

		try {
			// If the saveAudioFile setting is true, save the audio file
			if (this.plugin.settings.saveAudioFile) {
				const arrayBuffer = await blob.arrayBuffer();
				await this.plugin.app.vault.adapter.writeBinary(
					audioFilePath,
					new Uint8Array(arrayBuffer)
				);
				new Notice("Audio saved successfully.");
			}
		} catch (err) {
			console.error("Error saving audio file:", err);
			new Notice("Error saving audio file: " + err.message);
		}

		try {
			if (this.plugin.settings.debugMode) {
				new Notice("Processing audio data locally: " + fileName);
			}
			
			const transcriptionText = await this.localProcessor.processAudio(blob, fileName);

			// Determine if a new file should be created
			const activeView =
				this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
			const shouldCreateNewFile =
				this.plugin.settings.createNewFileAfterRecording || !activeView;

			if (shouldCreateNewFile) {
				const content = this.plugin.settings.saveAudioFile 
					? `![[${audioFilePath}]]\n${transcriptionText}`
					: transcriptionText;
				
				await this.plugin.app.vault.create(noteFilePath, content);
				await this.plugin.app.workspace.openLinkText(
					noteFilePath,
					"",
					true
				);
			} else {
				// Insert the transcription at the cursor position
				const editor =
					this.plugin.app.workspace.getActiveViewOfType(
						MarkdownView
					)?.editor;
				if (editor) {
					const cursorPosition = editor.getCursor();
					editor.replaceRange(transcriptionText, cursorPosition);

					// Move the cursor to the end of the inserted text
					const newPosition = {
						line: cursorPosition.line,
						ch: cursorPosition.ch + transcriptionText.length,
					};
					editor.setCursor(newPosition);
				}
			}

			new Notice("Audio transcribed successfully!");
		} catch (err) {
			console.error("Error transcribing audio:", err);
			new Notice("Error transcribing audio: " + err.message);
		}
	}

	updateLocalProcessor(): void {
		this.initializeLocalProcessor();
	}
}
