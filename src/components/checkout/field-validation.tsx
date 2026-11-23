"use client";

import { useState } from "react";

interface DeliveryFields {
  name: string;
  phone: string;
  address: string;
  thana: string;
  validDistrict: boolean;
}

export function useCheckoutValidation({ name, phone, address, thana, validDistrict }: DeliveryFields) {
  const errors: Record<string, string | false> = {
    name: name.trim().length < 2 && "Enter your full name (at least 2 characters).",
    phone: !/^01[3-9]\d{8}$/.test(phone.replace(/\D/g, "")) && "Enter an 11-digit Bangladesh mobile number, such as 01712345678.",
    address: address.trim().length < 6 && "Enter your delivery address, including your house or road (at least 6 characters).",
    city: !validDistrict && "Choose your district from the suggestions.",
    thana: thana.trim().length < 2 && "Enter your thana or upazila (at least 2 characters).",
  };
  const [submitted, setSubmitted] = useState(false);

  function validate(form: HTMLFormElement) {
    setSubmitted(true);
    for (const input of Array.from(form.querySelectorAll<HTMLInputElement>("input[id]"))) {
      if (!errors[input.id]) continue;
      input.focus({ preventScroll: true });
      input.scrollIntoView({ block: "center", behavior: "auto" });
      return false;
    }
    return true;
  }

  function props(id: string) {
    const invalid = submitted && !!errors[id];
    return { id, "aria-invalid": invalid || undefined, "aria-describedby": invalid ? id + "-error" : undefined };
  }

  function message(id: string) {
    return submitted && errors[id] ? (
      <span id={id + "-error"} role="alert" className="mt-1 block text-sm font-medium text-red-700 dark:text-red-300">
        {errors[id]}
      </span>
    ) : null;
  }

  return { validate, props, message };
}
