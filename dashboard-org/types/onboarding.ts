/**
 * Onboarding Flow Types
 * Defines the structure for the first-time user journey
 */

export type UserContext = 'self-deployer' | 'managed-user' | null;

export type OnboardingStep =
  | 'context-selection'
  | 'welcome'
  | 'components-overview'
  | 'requirements'
  | 'setup-guide'
  | 'completion';

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  userContext: UserContext;
  startedAt: string;
  completedAt?: string;
  isComplete: boolean;
  canSkip: boolean;
}

export interface ComponentInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  details: string[];
}

export interface Requirement {
  id: string;
  category: 'hardware' | 'software' | 'network' | 'optional';
  title: string;
  description: string;
  applicableTo: UserContext[];
  icon: string;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  applicableTo: UserContext[];
  substeps: {
    title: string;
    description: string;
    code?: string;
    important?: boolean;
  }[];
  estimatedTime: string;
}

export interface OnboardingConfig {
  mission: {
    title: string;
    subtitle: string;
    description: string[];
    highlights: string[];
  };
  components: ComponentInfo[];
  requirements: Requirement[];
  setupSteps: SetupStep[];
}
