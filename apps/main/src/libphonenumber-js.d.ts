declare module "libphonenumber-js" {
  export interface PhoneNumber {
    isValid(): boolean;
    format(format: "E.164" | string): string;
  }

  export function parsePhoneNumberFromString(
    value: string,
  ): PhoneNumber | undefined;
}
