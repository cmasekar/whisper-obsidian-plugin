import { Notice } from "obsidian";
import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";

const execAsync = promisify(exec);

export interface LocalWhisperConfig {
	whisperPath: string; // Path to whisper executable
	modelSize: string; // tiny, base, small, medium, large
	language?: string;
	outputFormat: string; // txt, srt, vtt, etc.
	additionalArgs?: string[];
}

export class LocalWhisperProcessor {
	private config: LocalWhisperConfig;
	private tempDir: string;

	constructor(config: LocalWhisperConfig) {
		this.config = config;
		this.tempDir = path.join(process.cwd(), '.whisper-temp');
		this.ensureTempDir();
	}

	private ensureTempDir(): void {
		if (!fs.existsSync(this.tempDir)) {
			fs.mkdirSync(this.tempDir, { recursive: true });
		}
	}

	private async saveAudioFile(blob: Blob, fileName: string): Promise<string> {
		const filePath = path.join(this.tempDir, fileName);
		const arrayBuffer = await blob.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		
		fs.writeFileSync(filePath, buffer);
		return filePath;
	}

	private buildWhisperCommand(inputFile: string, outputDir: string): string[] {
		const command = [this.config.whisperPath];
		
		// Input file
		command.push(inputFile);
		
		// Model
		command.push('--model', this.config.modelSize);
		
		// Language (if specified)
		if (this.config.language && this.config.language !== 'auto') {
			command.push('--language', this.config.language);
		}
		
		// Output format
		command.push('--output_format', this.config.outputFormat);
		
		// Output directory
		command.push('--output_dir', outputDir);
		
		// Additional arguments
		if (this.config.additionalArgs) {
			command.push(...this.config.additionalArgs);
		}
		
		return command;
	}

	async checkWhisperInstallation(): Promise<boolean> {
		try {
			const { stdout } = await execAsync(`${this.config.whisperPath} --help`);
			return stdout.includes('whisper');
		} catch (error) {
			console.error('Whisper installation check failed:', error);
			return false;
		}
	}

	async processAudio(blob: Blob, fileName: string): Promise<string> {
		try {
			// Save audio file to temp directory
			const audioFilePath = await this.saveAudioFile(blob, fileName);
			
			// Create output directory
			const outputDir = path.join(this.tempDir, 'output');
			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, { recursive: true });
			}

			// Build and execute whisper command
			const command = this.buildWhisperCommand(audioFilePath, outputDir);
			const commandString = command.join(' ');
			
			console.log('Executing Whisper command:', commandString);
			
			const { stdout, stderr } = await execAsync(commandString);
			
			if (stderr) {
				console.warn('Whisper stderr:', stderr);
			}
			
			// Read the transcription result
			const baseFileName = path.parse(fileName).name;
			const transcriptionFile = path.join(outputDir, `${baseFileName}.${this.config.outputFormat}`);
			
			if (!fs.existsSync(transcriptionFile)) {
				throw new Error(`Transcription file not found: ${transcriptionFile}`);
			}
			
			const transcription = fs.readFileSync(transcriptionFile, 'utf8');
			
			// Clean up temporary files
			this.cleanupTempFiles(audioFilePath, transcriptionFile);
			
			return transcription.trim();
			
		} catch (error) {
			console.error('Local Whisper processing failed:', error);
			throw new Error(`Failed to process audio locally: ${error.message}`);
		}
	}

	private cleanupTempFiles(...filePaths: string[]): void {
		filePaths.forEach(filePath => {
			try {
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			} catch (error) {
				console.warn(`Failed to cleanup file ${filePath}:`, error);
			}
		});
	}

	updateConfig(config: Partial<LocalWhisperConfig>): void {
		this.config = { ...this.config, ...config };
	}
}