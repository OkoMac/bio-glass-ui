// ─── N-14: Onboarding Layer Type System ─────────────────────────────────────

/**
 * Enum representing the 4 onboarding layers in BION.
 */
export enum OnboardingLayer {
  Layer1 = "layer1",
  Layer2 = "layer2",
  Layer3 = "layer3",
  Layer4 = "layer4",
}

/**
 * Definition of a single onboarding layer.
 */
export interface OnboardingLayerDef {
  /** Machine key matching the OnboardingLayer enum value */
  key: OnboardingLayer;
  /** Human-readable display name */
  name: string;
  /** Short description of what this layer covers */
  description: string;
  /** What event or condition triggers this layer */
  trigger: string;
  /** Whether completion persists server-side (true) or is ephemeral */
  persistence: boolean;
}

/**
 * Complete definition array documenting all 4 onboarding layers.
 * Used for rendering layer status UI and driving onboarding flow logic.
 */
export const LAYER_DEFINITIONS: OnboardingLayerDef[] = [
  {
    key: OnboardingLayer.Layer1,
    name: "Welcome / Account Setup",
    description: "Initial account creation and basic profile setup.",
    trigger: "User registers or logs in for the first time",
    persistence: true,
  },
  {
    key: OnboardingLayer.Layer2,
    name: "Role-Specific Wizard",
    description: "Post-auth role-specific wizard guiding users through their role configuration.",
    trigger: "Post-auth role assignment (client / provider / corporate)",
    persistence: true,
  },
  {
    key: OnboardingLayer.Layer3,
    name: "Deep Dive / Second Login",
    description: "Deeper engagement flow shown on the user's second login.",
    trigger: "Second login (login_count >= 2)",
    persistence: true,
  },
  {
    key: OnboardingLayer.Layer4,
    name: "Advanced Setup",
    description: "Optional advanced configuration and preferences for power users.",
    trigger: "Manual trigger or feature discovery prompt",
    persistence: true,
  },
];
