export class AppError extends Error {
  readonly code: string;

  constructor(message: string, code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export class ToolExecutionError extends AppError {
  constructor(message: string, code = "TOOL_EXECUTION_ERROR") {
    super(message, code);
    this.name = "ToolExecutionError";
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}
