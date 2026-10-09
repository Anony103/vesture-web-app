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
  address: string;
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
  address: "",
  phone: "",
};
export const steps = [
  "account-type",
  "details",
  "verify",
  "identity",
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
