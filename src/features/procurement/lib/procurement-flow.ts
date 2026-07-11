/** Shared, framework-agnostic mapping of procurement statuses to the unified
 * stepper position (Requested → Approved → Ordered → Paid → Received). Kept out
 * of the client component so server components can call them directly. */

/** Map a purchase request status to its position in the unified flow. */
export function prActiveStep(status: string | null): number | null {
  switch (status) {
    case "draft":
    case "pending":
      return 2; // Requested done, awaiting approval
    case "approved":
      return 3; // Approved, awaiting PO
    case "converted":
      return 4; // PO created
    default:
      return null; // rejected / cancelled — no linear progress to show
  }
}

/** Map a purchase order's status + payment status to the unified flow. */
export function poActiveStep(
  status: string | null,
  paymentStatus: string | null,
): number | null {
  if (status === "cancelled") return null;
  if (status === "complete") return 6; // everything done
  if (paymentStatus === "paid") return 5; // paid, awaiting receipt
  return 4; // ordered, awaiting payment
}
