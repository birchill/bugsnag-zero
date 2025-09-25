export type UserAgentInfo = {
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  manufacturer?: string;
  model?: string;
  modelNumber?: string;
};

export type UserAgentParserFn = (userAgent: string) => UserAgentInfo;
