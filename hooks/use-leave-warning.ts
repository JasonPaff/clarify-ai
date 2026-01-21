'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseLeaveWarningOptions {
  /** Whether an AI operation is currently running */
  isActive: boolean;
  /** Callback to cancel the AI operation when user confirms leaving */
  onCancel: () => void;
  /** Human-readable name of the current step for the dialog message */
  stepName: string;
}

interface UseLeaveWarningReturn {
  /**
   * Dismisses the warning dialog without proceeding with navigation.
   * Use this when the user cancels the navigation attempt.
   */
  dismissWarning: () => void;
  /**
   * Proceeds with the navigation, cancelling the AI operation.
   * Use this when the user confirms they want to leave despite the active operation.
   */
  proceedNavigation: () => void;
  /**
   * Call this function when the user attempts to navigate away.
   * Returns `true` if navigation should proceed immediately (no AI operation running),
   * returns `false` if navigation is blocked and a warning should be shown.
   * When blocked, the `showWarning` state will be set to `true`.
   */
  requestNavigation: () => boolean;
  /** Whether the leave warning dialog should be shown */
  showWarning: boolean;
}

/**
 * Hook for preventing navigation away from pages with active AI operations.
 *
 * This hook provides:
 * 1. `beforeunload` event handling to prevent browser/Electron window closure
 * 2. State and handlers for showing a confirmation dialog when navigation is attempted
 *
 * The hook integrates with the CancelAiDialog component - parent components should
 * render the dialog when `showWarning` is true and use the provided handlers for the
 * dialog's confirm/cancel actions.
 *
 * @example
 * ```tsx
 * const { showWarning, proceedNavigation, dismissWarning, requestNavigation } = useLeaveWarning({
 *   isActive: isAiRunning,
 *   stepName: 'Clarification',
 *   onCancel: cancelClarification,
 * });
 *
 * // When user clicks a navigation link
 * const onStepClick = (targetStep: string) => {
 *   if (requestNavigation()) {
 *     // Navigation allowed, proceed immediately
 *     goToStep(targetStep);
 *   }
 *   // If false, showWarning is now true and dialog will be shown
 * };
 *
 * // Render the warning dialog
 * <CancelAiDialog
 *   open={showWarning}
 *   stepName={stepName}
 *   onConfirm={() => {
 *     proceedNavigation();
 *     // Proceed with the pending navigation after dialog closes
 *   }}
 *   onOpenChange={(open) => {
 *     if (!open) dismissWarning();
 *   }}
 * />
 * ```
 */
export function useLeaveWarning({ isActive, onCancel, stepName }: UseLeaveWarningOptions): UseLeaveWarningReturn {
  // Track whether user has requested navigation (warning dialog open state)
  const [isWarningRequested, setIsWarningRequested] = useState(false);

  // Keep refs for the latest values to avoid stale closures in event handlers
  const isActiveRef = useRef(isActive);
  const onCancelRef = useRef(onCancel);
  const stepNameRef = useRef(stepName);

  // Update refs when values change
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    stepNameRef.current = stepName;
  }, [stepName]);

  // Reset isWarningRequested when isActive becomes false.
  // This prevents stale warnings from appearing on subsequent AI operations.
  // Using setState in effect is justified here: we're synchronizing internal state
  // with an external prop change, which is a valid use of useEffect.
  useEffect(() => {
    if (!isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing state with prop transition is valid
      setIsWarningRequested(false);
    }
  }, [isActive]);

  // Derive showWarning: only show if both requested AND operation is still active
  const showWarning = isWarningRequested && isActive;

  // Set up beforeunload event listener when AI operation is active
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Standard way to trigger the browser's native confirmation dialog
      event.preventDefault();
      // Some browsers require returnValue to be set (Chrome, Edge)
      // The actual message shown is browser-controlled for security reasons
      event.returnValue = `The ${stepNameRef.current} step is still running. Are you sure you want to leave?`;
      return event.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActive]);

  /**
   * Request navigation - returns true if navigation can proceed immediately,
   * false if blocked (and showWarning will be set to true).
   */
  const requestNavigation = useCallback((): boolean => {
    if (!isActiveRef.current) {
      // No AI operation running, navigation can proceed
      return true;
    }

    // AI operation is running, show warning dialog
    setIsWarningRequested(true);
    return false;
  }, []);

  /**
   * Proceed with navigation after user confirms in the warning dialog.
   * This cancels the AI operation and closes the dialog.
   */
  const proceedNavigation = useCallback(() => {
    setIsWarningRequested(false);
    // Cancel the AI operation
    onCancelRef.current();
  }, []);

  /**
   * Dismiss the warning dialog without proceeding.
   * User decided not to navigate away.
   */
  const dismissWarning = useCallback(() => {
    setIsWarningRequested(false);
  }, []);

  return {
    dismissWarning,
    proceedNavigation,
    requestNavigation,
    showWarning,
  };
}
