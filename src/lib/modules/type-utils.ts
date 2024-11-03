export function make<T>(value: T): T {
	return value;
}

export function assertType<T>(value: T): asserts value is T {}
