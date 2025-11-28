export enum Screen {
  ONBOARDING = 'ONBOARDING',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  HOME = 'HOME',
}

export interface OnboardingSlideData {
  id: number;
  title: string;
  description: string;
  Illustration: React.ComponentType<any>;
  color: string;
}
