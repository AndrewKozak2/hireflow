import { LlmSchemaValidationError } from "./llm.errors";
import { LlmOutputSchema } from "./interfaces/llm.interface";

type ObjectShape<Output extends object> = {
  [Key in keyof Output]: (value: unknown, key: string) => Output[Key];
};

export function createObjectSchema<Output extends object>(
  name: string,
  shape: ObjectShape<Output>,
): LlmOutputSchema<Output> {
  return {
    name,
    parse(value: unknown): Output {
      if (!isRecord(value)) {
        throw new LlmSchemaValidationError(`${name} output must be an object`, {
          value,
        });
      }

      const parsed = {} as Output;
      for (const key of Object.keys(shape) as Array<keyof Output>) {
        parsed[key] = shape[key](value[String(key)], String(key));
      }
      return parsed;
    },
  };
}

export function nullableString(value: unknown, key: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new LlmSchemaValidationError(`${key} must be a string or null`, {
      value,
    });
  }

  return value;
}

export function nullableBoolean(value: unknown, key: string): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "boolean") {
    throw new LlmSchemaValidationError(`${key} must be a boolean or null`, {
      value,
    });
  }

  return value;
}

export function stringValue(value: unknown, key: string): string {
  if (typeof value !== "string") {
    throw new LlmSchemaValidationError(`${key} must be a string`, {
      value,
    });
  }

  return value;
}

export function stringArray(value: unknown, key: string): string[] {
  if (!Array.isArray(value)) {
    throw new LlmSchemaValidationError(`${key} must be an array of strings`, {
      value,
    });
  }

  const rawItems: unknown[] = value;
  const items: string[] = [];
  for (const item of rawItems) {
    if (typeof item !== "string") {
      throw new LlmSchemaValidationError(`${key} must contain only strings`, {
        value,
      });
    }
    items.push(item);
  }

  return items;
}

export function enumValue<const Values extends readonly string[]>(
  values: Values,
) {
  return (value: unknown, key: string): Values[number] => {
    if (typeof value !== "string" || !values.includes(value)) {
      throw new LlmSchemaValidationError(
        `${key} must be one of: ${values.join(", ")}`,
        { value },
      );
    }

    return value;
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
