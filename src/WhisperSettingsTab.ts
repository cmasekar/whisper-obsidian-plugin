import Whisper from "main";
import { App, PluginSettingTab, Setting, TFolder } from "obsidian";
import { SettingsManager } from "./SettingsManager";

export class WhisperSettingsTab extends PluginSettingTab {
	private plugin: Whisper;
	private settingsManager: SettingsManager;
	private createNewFileInput: Setting;
	private saveAudioFileInput: Setting;

	constructor(app: App, plugin: Whisper) {
		super(app, plugin);
		this.plugin = plugin;
		this.settingsManager = plugin.settingsManager;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		this.createHeader();
		this.createWhisperPathSetting();
		this.createModelSizeSetting();
		this.createLanguageSetting();
		this.createAdditionalArgsSetting();
		this.createSaveAudioFileToggleSetting();
		this.createSaveAudioFilePathSetting();
		this.createNewFileToggleSetting();
		this.createNewFilePathSetting();
		this.createDebugModeToggleSetting();
	}

	private getUniqueFolders(): TFolder[] {
		const files = this.app.vault.getMarkdownFiles();
		const folderSet = new Set<TFolder>();

		for (const file of files) {
			const parentFolder = file.parent;
			if (parentFolder && parentFolder instanceof TFolder) {
				folderSet.add(parentFolder);
			}
		}

		return Array.from(folderSet);
	}

	private createHeader(): void {
		this.containerEl.createEl("h2", { text: "Local Whisper Settings" });
		this.containerEl.createEl("p", { 
			text: "Configure local OpenAI Whisper installation for offline speech-to-text transcription." 
		});
	}

	private createTextSetting(
		name: string,
		desc: string,
		placeholder: string,
		value: string,
		onChange: (value: string) => Promise<void>
	): void {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(desc)
			.addText((text) =>
				text
					.setPlaceholder(placeholder)
					.setValue(value)
					.onChange(async (value) => await onChange(value))
			);
	}

	private createWhisperPathSetting(): void {
		this.createTextSetting(
			"Whisper Executable Path",
			"Path to the Whisper executable (e.g., 'whisper' if installed globally, or full path like '/usr/local/bin/whisper')",
			"whisper",
			this.plugin.settings.whisperPath,
			async (value) => {
				this.plugin.settings.whisperPath = value;
				await this.settingsManager.saveSettings(this.plugin.settings);
				this.plugin.audioHandler.updateLocalProcessor();
			}
		);
	}

	private createModelSizeSetting(): void {
		new Setting(this.containerEl)
			.setName("Model Size")
			.setDesc("Choose the Whisper model size. Larger models are more accurate but slower.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("tiny", "tiny (39 MB)")
					.addOption("base", "base (74 MB)")
					.addOption("small", "small (244 MB)")
					.addOption("medium", "medium (769 MB)")
					.addOption("large", "large (1550 MB)")
					.setValue(this.plugin.settings.modelSize)
					.onChange(async (value) => {
						this.plugin.settings.modelSize = value;
						await this.settingsManager.saveSettings(this.plugin.settings);
						this.plugin.audioHandler.updateLocalProcessor();
					})
			);
	}

	private createAdditionalArgsSetting(): void {
		this.createTextSetting(
			"Additional Arguments",
			"Optional additional command-line arguments for Whisper (comma-separated)",
			"--fp16=False, --device=cpu",
			this.plugin.settings.additionalWhisperArgs.join(", "),
			async (value) => {
				this.plugin.settings.additionalWhisperArgs = value
					.split(",")
					.map(arg => arg.trim())
					.filter(arg => arg.length > 0);
				await this.settingsManager.saveSettings(this.plugin.settings);
				this.plugin.audioHandler.updateLocalProcessor();
			}
		);
	}

	private createLanguageSetting(): void {
		new Setting(this.containerEl)
			.setName("Language")
			.setDesc("Specify the language for transcription. Use 'auto' for automatic detection.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("auto", "Auto-detect")
					.addOption("en", "English")
					.addOption("es", "Spanish")
					.addOption("fr", "French")
					.addOption("de", "German")
					.addOption("it", "Italian")
					.addOption("ja", "Japanese")
					.addOption("ko", "Korean")
					.addOption("pt", "Portuguese")
					.addOption("ru", "Russian")
					.addOption("zh", "Chinese")
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value;
						await this.settingsManager.saveSettings(this.plugin.settings);
						this.plugin.audioHandler.updateLocalProcessor();
					})
			);
	}

	private createSaveAudioFileToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Save recording")
			.setDesc(
				"Turn on to save the audio file after transcription"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.saveAudioFile)
					.onChange(async (value) => {
						this.plugin.settings.saveAudioFile = value;
						if (!value) {
							this.plugin.settings.saveAudioFilePath = "";
						}
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
						this.saveAudioFileInput.setDisabled(!value);
					})
			);
	}

	private createSaveAudioFilePathSetting(): void {
		this.saveAudioFileInput = new Setting(this.containerEl)
			.setName("Recordings folder")
			.setDesc(
				"Specify the path in the vault where to save the audio files"
			)
			.addText((text) =>
				text
					.setPlaceholder("Example: folder/audio")
					.setValue(this.plugin.settings.saveAudioFilePath)
					.onChange(async (value) => {
						this.plugin.settings.saveAudioFilePath = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					})
			)
			.setDisabled(!this.plugin.settings.saveAudioFile);
	}

	private createNewFileToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Save transcription")
			.setDesc(
				"Turn on to create a new file for each recording, or leave off to add transcriptions at your cursor"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.createNewFileAfterRecording)
					.onChange(async (value) => {
						this.plugin.settings.createNewFileAfterRecording =
							value;
						if (!value) {
							this.plugin.settings.createNewFileAfterRecordingPath =
								"";
						}
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
						this.createNewFileInput.setDisabled(!value);
					});
			});
	}

	private createNewFilePathSetting(): void {
		this.createNewFileInput = new Setting(this.containerEl)
			.setName("Transcriptions folder")
			.setDesc(
				"Specify the path in the vault where to save the transcription files"
			)
			.addText((text) => {
				text.setPlaceholder("Example: folder/note")
					.setValue(
						this.plugin.settings.createNewFileAfterRecordingPath
					)
					.onChange(async (value) => {
						this.plugin.settings.createNewFileAfterRecordingPath =
							value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
			});
	}

	private createDebugModeToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Debug Mode")
			.setDesc(
				"Turn on to increase the plugin's verbosity for troubleshooting."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.debugMode)
					.onChange(async (value) => {
						this.plugin.settings.debugMode = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
			});
	}
}
