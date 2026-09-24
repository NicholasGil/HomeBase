"use server";

import {
  createFixtureBrokerageFromForm,
  joinFixtureBrokerageFromForm,
} from "@/app/actions/brokerage-onboarding";

export async function submitFixtureBrokerageOnboarding(formData: FormData) {
  const intent = formData.get("intent");
  if (intent === "join") {
    await joinFixtureBrokerageFromForm(formData);
    return;
  }
  await createFixtureBrokerageFromForm(formData);
}
