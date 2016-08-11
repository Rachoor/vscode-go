declare module Docker {
	interface Modem {
		demuxStream(stream: NodeJS.ReadWriteStream, stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void;
	}

	interface DockerOptions {
		socketPath: string;
	}

	interface HostConfig {
		Binds: string[];
	}

	interface CreateContainerOptions {
		Image: string;
		Volumes: { [path: string]: any; };
		HostConfig: HostConfig;
	}

	interface StartOptions {
		hijack?: boolean;
		stdin?: boolean;
	}

	interface ExecInspectData {
		ExitCode: number;
	}

	class Exec {
		start(options: StartOptions, cb: (err: Error, stream: NodeJS.ReadWriteStream)=>void): void;
		inspect(cb: (err: Error, data: ExecInspectData)=>void): void;
	}

	interface ExecOptions {
		AttachStdin?: boolean;
		AttachStdout?: boolean;
		AttachStderr?: boolean;
		Tty?: boolean;
		Cmd?: string[];
	}

	class Container {
		start(options: any, cb: (err: Error, data: any)=>void): void;
		start(cb: (err: Error, data: any)=>void): void;
		exec(options: ExecOptions, cb: (err: Error, exec: Exec)=>void): void;
	}
}


declare class Docker {
	modem: Docker.Modem;
	constructor(options: Docker.DockerOptions);

	createContainer(options: Docker.CreateContainerOptions, cb: (err: Error, container: Docker.Container)=>void): void;
}

declare module "dockerode" {
    export = Docker;
}