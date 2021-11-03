type EnvVarName =
	| 'DB_HOST'
	| 'DB_USER'
	| 'DB_PASSWORD'
	| 'DB_PORT'
	| 'DB_NAME'
	| 'DB_SECRET'

type EnvFlagName = never;

export function getEnvVar(name: EnvVarName | EnvFlagName, defaultValue?: string): string {
	const res = process.env[name] ?? defaultValue;
	if (typeof res === 'undefined') {
		throw new Error(`Environment variable '${name}' is not defined`);
	}
	return res;
}