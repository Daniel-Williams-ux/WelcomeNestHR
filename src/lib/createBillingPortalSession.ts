// lib/createBillingPortalSession.ts
export async function redirectToBillingPortal(idToken: string) {
  const response = await fetch("/api/create-stripe-portal-link", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to create billing portal session");
  }

  const { url } = await response.json();
  window.location.href = url;
}