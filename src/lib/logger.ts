import process from 'node:process';
import {cursorTo, clearScreenDown} from "node:readline";
import type {InspectOptions} from 'node:util';
import {inspect, format} from 'node:util';
import Color from './color';
import type {IWritable, ILogger, ILoggerOptions} from "./interfaces";
import {Level, Levels} from './level';

const lineEnd = (process.platform === "win32")?"\r\n":"\n"

export class Logger implements ILogger {
	private readonly std: IWritable;

	private readonly level: Level;

	private readonly color: boolean;

	private indent: number = 0;

	public constructor({std = process.stdout, level = Level.LOG, colorMode = true}: ILoggerOptions)
	{
		this.std = std;
		this.level = level;
		this.color = std.isTTY ? colorMode : false;
	};

	private _time(): string {
		return new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
	};

	public write(lvl: Level, str?: string, ...data: any): void {
		if (this.level < lvl) return; // if the level of the logger is less than the content one, we should not print anything

		const arr = ["[", this._time(), "] [", "] ", format(str, ...data), lineEnd];

		for (let iter = 0; iter < this.indent; iter++) arr[3] += "  ";

		if (this.color) {
			arr.splice(3, 0, Levels[lvl].color, Levels[lvl].name, Color.RESET);
			arr.splice(-2,0, Levels[lvl].color);
			arr.splice(-1,0, Color.RESET);
		} else {
			arr.splice(3, 0, Levels[lvl].name);
		}

		this.std.write(arr.join(""));
	};

	public error(message?: any, ...optionalParams: any[]): void {
		this.write(Level.ERROR, message, ...optionalParams);
	};

	public warn(message?: any, ...optionalParams: any[]): void {
		this.write(Level.WARN, message, ...optionalParams);
	};

	public info(message?: any, ...optionalParams: any[]): void {
		this.write(Level.INFO, message, ...optionalParams);
	};

	public log(message?: any, ...optionalParams: any[]): void {
		this.write(Level.LOG, message, ...optionalParams);
	};

	public debug(message?: any, ...optionalParams: any[]): void {
		this.write(Level.DEBUG, message, ...optionalParams);
	};

	public assert(value?: any, message?: string, ...optionalParams: any[]): void {
		if (!value)
			this.write(
				Level.WARN,
				message ? 'Assertion failed: ' + message : 'Assertion failed',
				...optionalParams,
			);
	};

	public clear(): void {
		if (!this.std.isTTY) return;
		cursorTo(this.std, 0, 0);
		clearScreenDown(this.std);
	};

	public dir(obj: any, options?: InspectOptions): void {
		this.log(inspect(obj, options));
	};

	public group(...label: any[]): void {
		this.log(...label);
		this.indent += 1;
	};

	public groupEnd(): void {
		this.indent -= 1;
	};
}