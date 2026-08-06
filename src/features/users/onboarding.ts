import type { OnboardingStep } from "@/types/user";

export const ONBOARDING_STEPS_ORDER: OnboardingStep[] = [
  "profile_details",
  "phone_verification",
  "kyc_verification",
  "wallet_setup",
];

export const ONBOARDING_STEP_LABEL: Record<OnboardingStep, string> = {
  profile_details: "Profile details",
  phone_verification: "Phone verification",
  kyc_verification: "KYC verification",
  wallet_setup: "Wallet setup",
};
