"use client";

import type { SignupConfirmation } from "@/types";
import { Button } from "@/components/ui/Button";

interface ConfirmationViewProps {
  confirmation: SignupConfirmation;
  onClose: () => void;
}

export function ConfirmationView({ confirmation, onClose }: ConfirmationViewProps) {
  if (confirmation.role === "group_lead") {
    const linkSent = confirmation.shareLinkSent;
    return (
      <div className="p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-indy-navy">
            {linkSent ? "Check your inbox." : "Got it — we'll be in touch."}
          </h3>
          <p className="text-gray-600">
            {linkSent
              ? `Thanks, ${confirmation.name}. We just emailed your share-link.`
              : `Thanks, ${confirmation.name}. We got your request to bring your group to a rally point.`}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 text-left space-y-3">
          {linkSent ? (
            <>
              <p className="text-sm text-gray-700">
                Your unique sign-up link is in your inbox now. Forward it to your group and have
                each person register themselves for{" "}
                <strong>{confirmation.rallyPoint.name}</strong>.
              </p>
              <p className="text-sm text-gray-700">
                Each person gets their own confirmation, t-shirt size, and event-day reminders.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700">
                We&apos;ll email you within 1&ndash;2 business days to confirm a park
                {confirmation.rallyPoint.name ? ` (you preferred ${confirmation.rallyPoint.name})` : ""}{" "}
                and send you a sign-up link you can share with your group.
              </p>
              <p className="text-sm text-gray-700">
                Each person on your team will use that link to register themselves — they&apos;ll get
                their own confirmation, t-shirt size, and event-day reminders.
              </p>
            </>
          )}
        </div>

        <Button variant="secondary" onClick={onClose} className="w-full">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 text-center space-y-6">
      {/* Success icon */}
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg
          className="w-8 h-8 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-black text-indy-navy">You&apos;re In!</h3>
        <p className="text-gray-600">
          Thanks, {confirmation.name}! You&apos;re signed up
          {confirmation.role === "site_leader" ? " as a Site Leader" : ""}.
        </p>
      </div>

      {/* Rally point info */}
      <div className="bg-white rounded-xl p-6 text-left space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Your Rally Point
          </p>
          <p className="text-lg font-bold text-indy-navy">
            {confirmation.rallyPoint.name}
          </p>
          <p className="text-sm text-gray-600">
            {confirmation.rallyPoint.address}
          </p>
        </div>

        <div className="flex gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Date
            </p>
            <p className="text-sm font-semibold text-indy-navy">
              {confirmation.eventDate}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Time
            </p>
            <p className="text-sm font-semibold text-indy-navy">
              {confirmation.eventTime}
            </p>
          </div>
        </div>

        {confirmation.groupSize > 1 && (
          <p className="text-sm text-gray-600">
            Group size: {confirmation.groupSize} people
          </p>
        )}
      </div>

      <p className="text-sm text-gray-500">
        A confirmation email is on its way with all the details.
      </p>

      <Button variant="secondary" onClick={onClose} className="w-full">
        Back to Home
      </Button>
    </div>
  );
}
