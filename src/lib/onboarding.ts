export type AccountType = "private" | "public";
export type Profile = {
  firstName: string;
  middleName: string;
  lastName: string;
  bvn: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  stateOfOrigin: string;
  // No home address at sign-up: it is collected and verified later, in KYC (Settings > Verify your identity).
  phone: string;
};
export const emptyProfile: Profile = {
  firstName: "",
  middleName: "",
  lastName: "",
  bvn: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  stateOfOrigin: "",
  phone: "",
};
export const steps = [
  "account-type",
  "details",
  "verify",
  // "identity",   // The identity-document upload step is not needed for sign-up. The screen is kept in
  //                  components/auth/identity-form.tsx: put "identity" back here (between "verify" and
  //                  "review"), and in signup-flow.tsx, to switch it on again.
  "review",
  "password",
  "complete",
] as const;
export type SignupStep = (typeof steps)[number];
export const states = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];
