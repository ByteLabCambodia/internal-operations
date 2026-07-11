"use client";

import { Check } from "lucide-react";

import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";

const STEPS = ["Requested", "Approved", "Ordered", "Paid", "Received"];

/**
 * Read-only progress indicator for the procurement lifecycle that spans a
 * purchase request → purchase order → payment → receipt. `activeStep` is
 * 1-based; steps before it render as completed.
 */
export function ProcurementStepper({ activeStep }: { activeStep: number }) {
  return (
    <Stepper
      value={activeStep}
      indicators={{ completed: <Check className="size-3.5" /> }}
    >
      <StepperNav>
        {STEPS.map((label, i) => {
          const step = i + 1;
          return (
            <StepperItem key={step} step={step} className="not-last:flex-1">
              <StepperTrigger asChild className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <StepperIndicator className="data-[state=active]:bg-success data-[state=active]:text-white data-[state=completed]:bg-success data-[state=completed]:text-white">
                  {step}
                </StepperIndicator>
                <StepperTitle className="hidden sm:block">{label}</StepperTitle>
              </StepperTrigger>
              {step < STEPS.length && <StepperSeparator />}
            </StepperItem>
          );
        })}
      </StepperNav>
    </Stepper>
  );
}
