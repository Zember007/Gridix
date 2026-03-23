declare module "react-international-phone" {
  import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

  export interface PhoneInputProps {
    className?: string;
    style?: CSSProperties;
    defaultCountry?: string;
    preferredCountries?: string[];
    value?: string;
    onChange?: (value: string) => void;
    inputClassName?: string;
    countrySelectorStyleProps?: {
      buttonClassName?: string;
    };
    inputProps?: InputHTMLAttributes<HTMLInputElement>;
    disabled?: boolean;
    children?: ReactNode;
  }

  export function PhoneInput(props: PhoneInputProps): JSX.Element;
}

declare module "react-international-phone/style.css";
